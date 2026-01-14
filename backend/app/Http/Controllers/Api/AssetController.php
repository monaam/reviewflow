<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApprovalLog;
use App\Models\Asset;
use App\Models\AssetVersion;
use App\Models\Project;
use App\Services\DiscordNotificationService;
use App\Services\FileUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssetController extends Controller
{
    public function __construct(
        protected FileUploadService $uploadService,
        protected DiscordNotificationService $discord
    ) {}

    public function index(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $query = $project->assets()
            ->with(['uploader', 'latestVersion']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('uploaded_by')) {
            $query->where('uploaded_by', $request->uploaded_by);
        }

        $assets = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($assets);
    }

    public function store(Request $request, Project $project): JsonResponse
    {
        $this->authorize('uploadAsset', $project);

        $validated = $request->validate([
            'file' => 'required|file|max:512000',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'request_id' => 'nullable|uuid|exists:creative_requests,id',
        ]);

        $file = $request->file('file');
        $type = $this->determineAssetType($file);

        // Upload file
        $uploadResult = $this->uploadService->upload($file, "assets/{$project->id}");

        // Create asset
        $asset = Asset::create([
            'project_id' => $project->id,
            'uploaded_by' => $request->user()->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'type' => $type,
            'status' => 'pending_review',
            'current_version' => 1,
        ]);

        // Create first version
        AssetVersion::create([
            'asset_id' => $asset->id,
            'version_number' => 1,
            'file_url' => $uploadResult['url'],
            'file_path' => $uploadResult['path'],
            'file_size' => $file->getSize(),
            'file_meta' => $this->getFileMeta($file, $type),
            'uploaded_by' => $request->user()->id,
        ]);

        // Link to request if provided
        if (isset($validated['request_id'])) {
            $asset->creativeRequests()->attach($validated['request_id']);
        }

        // Send Discord notification
        $this->discord->notifyNewUpload($asset);

        return response()->json($asset->load(['uploader', 'latestVersion', 'project']), 201);
    }

    public function show(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('view', $asset);

        $asset->load([
            'project',
            'uploader',
            'versions.uploader',
            'comments' => fn($q) => $q->with('user')->orderBy('created_at', 'desc'),
            'approvalLogs' => fn($q) => $q->with('user')->orderBy('created_at', 'desc'),
            'creativeRequests',
        ]);

        // Mark as in_review if PM is viewing and asset is pending
        if ($request->user()->canApprove() && $asset->status === 'pending_review') {
            $asset->update(['status' => 'in_review']);
        }

        return response()->json($asset);
    }

    public function update(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('update', $asset);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'deadline' => 'nullable|date',
        ]);

        $asset->update($validated);

        return response()->json($asset->fresh(['uploader', 'latestVersion']));
    }

    public function destroy(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('delete', $asset);

        // Delete all version files
        foreach ($asset->versions as $version) {
            $this->uploadService->delete($version->file_path);
        }

        $asset->delete();

        return response()->json(['message' => 'Asset deleted successfully']);
    }

    public function uploadVersion(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('uploadVersion', $asset);

        $request->validate([
            'file' => 'required|file|max:512000',
        ]);

        $file = $request->file('file');
        $newVersion = $asset->current_version + 1;

        // Upload file
        $uploadResult = $this->uploadService->upload($file, "assets/{$asset->project_id}");

        // Create new version
        AssetVersion::create([
            'asset_id' => $asset->id,
            'version_number' => $newVersion,
            'file_url' => $uploadResult['url'],
            'file_path' => $uploadResult['path'],
            'file_size' => $file->getSize(),
            'file_meta' => $this->getFileMeta($file, $asset->type),
            'uploaded_by' => $request->user()->id,
        ]);

        // Update asset
        $asset->update([
            'current_version' => $newVersion,
            'status' => 'pending_review',
        ]);

        // Send Discord notification
        $this->discord->notifyNewVersion($asset);

        return response()->json($asset->fresh(['uploader', 'versions', 'latestVersion']), 201);
    }

    public function versions(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('view', $asset);

        $versions = $asset->versions()
            ->with('uploader')
            ->orderBy('version_number', 'desc')
            ->get();

        return response()->json($versions);
    }

    public function approve(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('approve', $asset);

        $validated = $request->validate([
            'comment' => 'nullable|string',
        ]);

        $asset->update(['status' => 'approved']);

        ApprovalLog::create([
            'asset_id' => $asset->id,
            'asset_version' => $asset->current_version,
            'user_id' => $request->user()->id,
            'action' => 'approved',
            'comment' => $validated['comment'] ?? null,
        ]);

        // Send Discord notification
        $this->discord->notifyApproval($asset, $request->user());

        return response()->json($asset->fresh(['approvalLogs.user']));
    }

    public function requestRevision(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('approve', $asset);

        $validated = $request->validate([
            'comment' => 'required|string',
        ]);

        $asset->update(['status' => 'revision_requested']);

        ApprovalLog::create([
            'asset_id' => $asset->id,
            'asset_version' => $asset->current_version,
            'user_id' => $request->user()->id,
            'action' => 'revision_requested',
            'comment' => $validated['comment'],
        ]);

        // Send Discord notification
        $this->discord->notifyRevisionRequested($asset, $request->user(), $validated['comment']);

        return response()->json($asset->fresh(['approvalLogs.user']));
    }

    public function linkRequest(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('update', $asset);

        $validated = $request->validate([
            'request_id' => 'required|uuid|exists:creative_requests,id',
        ]);

        $asset->creativeRequests()->syncWithoutDetaching([$validated['request_id']]);

        // Update request status if needed
        $creativeRequest = \App\Models\CreativeRequest::find($validated['request_id']);
        if ($creativeRequest && $creativeRequest->status === 'in_progress') {
            $creativeRequest->update(['status' => 'asset_submitted']);
        }

        return response()->json($asset->fresh('creativeRequests'));
    }

    protected function determineAssetType($file): string
    {
        $mime = $file->getMimeType();
        $extension = strtolower($file->getClientOriginalExtension());

        if (str_starts_with($mime, 'image/')) {
            return 'image';
        }

        if (str_starts_with($mime, 'video/')) {
            return 'video';
        }

        if ($mime === 'application/pdf' || $extension === 'pdf') {
            return 'pdf';
        }

        return 'design';
    }

    protected function getFileMeta($file, string $type): array
    {
        $meta = [
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'extension' => $file->getClientOriginalExtension(),
        ];

        if ($type === 'image') {
            $imageInfo = @getimagesize($file->getRealPath());
            if ($imageInfo) {
                $meta['width'] = $imageInfo[0];
                $meta['height'] = $imageInfo[1];
            }
        }

        return $meta;
    }
}
