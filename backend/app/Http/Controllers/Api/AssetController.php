<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApprovalLog;
use App\Models\Asset;
use App\Models\AssetVersion;
use App\Models\Comment;
use App\Models\CreativeRequest;
use App\Models\Project;
use App\Models\VersionLock;
use App\Jobs\GenerateThumbnailJob;
use App\Services\AssetTypes\AssetTypeRegistry;
use App\Services\DiscordNotificationService;
use App\Services\FileUploadService;
use App\Services\NotificationDispatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AssetController extends Controller
{
    public function __construct(
        protected FileUploadService $uploadService,
        protected DiscordNotificationService $discord,
        protected AssetTypeRegistry $assetTypeRegistry,
        protected NotificationDispatcher $notificationDispatcher
    ) {}

    public function listAll(Request $request): JsonResponse
    {
        $user = $request->user();

        // Get projects the user has access to
        $projectIds = $user->isAdmin()
            ? Project::pluck('id')
            : $user->projects()->pluck('projects.id');

        $query = Asset::whereIn('project_id', $projectIds)
            ->with(['uploader', 'project', 'latest_version']);

        // Reviewers can only see assets sent to them or already acted upon
        if ($user->isReviewer()) {
            $query->whereIn('status', ['client_review', 'approved', 'revision_requested']);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('uploaded_by')) {
            if ($request->uploaded_by === 'me') {
                $query->where('uploaded_by', $user->id);
            } else {
                $query->where('uploaded_by', $request->uploaded_by);
            }
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhereHas('project', function ($pq) use ($search) {
                      $pq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $assets = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($assets);
    }

    public function index(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $query = $project->assets()
            ->with(['uploader', 'latest_version']);

        // Reviewers can only see assets sent to them or already acted upon
        if ($request->user()->isReviewer()) {
            $query->whereIn('status', ['client_review', 'approved', 'revision_requested']);
        }

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
        $type = $this->assetTypeRegistry->determineType($file);

        // Validate file using registry
        $validationErrors = $this->assetTypeRegistry->validate($file);
        if (!empty($validationErrors)) {
            return response()->json(['errors' => ['file' => $validationErrors]], 422);
        }

        // Upload file
        $uploadResult = $this->uploadService->upload($file, "assets/{$project->id}");

        // Create asset
        // Admin/PM uploads go directly to in_review (they don't need to wait for PM review)
        $initialStatus = $request->user()->isAdmin() || $request->user()->isPM()
            ? 'in_review'
            : 'pending_review';

        $asset = Asset::create([
            'project_id' => $project->id,
            'uploaded_by' => $request->user()->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'type' => $type,
            'status' => $initialStatus,
            'current_version' => 1,
        ]);

        // Create first version with metadata from registry
        $assetVersion = AssetVersion::create([
            'asset_id' => $asset->id,
            'version_number' => 1,
            'file_url' => $uploadResult['url'],
            'file_path' => $uploadResult['path'],
            'file_size' => $file->getSize(),
            'file_meta' => $this->assetTypeRegistry->extractMetadata($file),
            'uploaded_by' => $request->user()->id,
        ]);

        // Dispatch thumbnail generation job in background for video/PDF
        if (in_array($type, ['video', 'pdf'])) {
            GenerateThumbnailJob::dispatch(
                $assetVersion->id,
                $type,
                $uploadResult['path'],
                $project->id
            );
        }

        // Link to request if provided
        if (isset($validated['request_id'])) {
            $asset->creativeRequests()->attach($validated['request_id']);

            // Auto-assign uploader if request has no assignee
            $creativeRequest = CreativeRequest::find($validated['request_id']);
            if ($creativeRequest && $creativeRequest->assigned_to === null) {
                $creativeRequest->update(['assigned_to' => $request->user()->id]);
            }
        }

        // Send Discord notification
        $this->discord->notifyNewUpload($asset);

        // Send in-app notification
        $this->notificationDispatcher->notifyAssetUploaded($asset, $request->user());

        return response()->json($asset->load(['uploader', 'latest_version', 'project']), 201);
    }

    public function show(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('view', $asset);

        $user = $request->user();

        // Reviewers have restricted view - only current version, own comments, own approval logs
        if ($user->isReviewer()) {
            $asset->load([
                'project',
                'uploader',
                'versions' => fn($q) => $q->with('uploader')->where('version_number', $asset->current_version),
                'comments' => fn($q) => $q->with('user')->where('user_id', $user->id)->orderBy('created_at', 'desc'),
                'approvalLogs' => fn($q) => $q->with('user')->where('user_id', $user->id)->orderBy('created_at', 'desc'),
            ]);
        } else {
            $asset->load([
                'project',
                'uploader',
                'versions.uploader',
                'comments' => fn($q) => $q->with('user')->orderBy('created_at', 'desc'),
                'approvalLogs' => fn($q) => $q->with('user')->orderBy('created_at', 'desc'),
                'creativeRequests',
            ]);

            // Mark as in_review if PM is viewing and asset is pending
            if ($user->canApprove() && $asset->status === 'pending_review') {
                $asset->update(['status' => 'in_review']);
            }
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

        return response()->json($asset->fresh(['uploader', 'latest_version']));
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

        // Check if asset is locked
        if ($asset->is_locked) {
            return response()->json([
                'message' => 'Cannot upload new version. Asset is locked.',
                'locked_by' => $asset->locker?->name,
                'locked_at' => $asset->locked_at?->toIso8601String(),
            ], 403);
        }

        $validated = $request->validate([
            'file' => 'required|file|max:512000',
            'version_notes' => 'nullable|string|max:1000',
        ]);

        $file = $request->file('file');
        $newVersion = $asset->current_version + 1;

        // Upload file
        $uploadResult = $this->uploadService->upload($file, "assets/{$asset->project_id}");

        // Create new version with metadata from registry
        $assetVersion = AssetVersion::create([
            'asset_id' => $asset->id,
            'version_number' => $newVersion,
            'file_url' => $uploadResult['url'],
            'file_path' => $uploadResult['path'],
            'file_size' => $file->getSize(),
            'file_meta' => $this->assetTypeRegistry->extractMetadata($file),
            'version_notes' => $validated['version_notes'] ?? null,
            'uploaded_by' => $request->user()->id,
        ]);

        // Dispatch thumbnail generation job in background for video/PDF
        if (in_array($asset->type, ['video', 'pdf'])) {
            GenerateThumbnailJob::dispatch(
                $assetVersion->id,
                $asset->type,
                $uploadResult['path'],
                $asset->project_id
            );
        }

        // Update asset
        // Admin/PM uploads go directly to in_review
        $newStatus = $request->user()->isAdmin() || $request->user()->isPM()
            ? 'in_review'
            : 'pending_review';

        $asset->update([
            'current_version' => $newVersion,
            'status' => $newStatus,
        ]);

        // Send Discord notification
        $this->discord->notifyNewVersion($asset);

        // Send in-app notification
        $this->notificationDispatcher->notifyNewVersion($asset, $request->user());

        return response()->json($asset->fresh(['uploader', 'versions', 'latest_version']), 201);
    }

    public function versions(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('view', $asset);

        // Reviewers only see the current version, not version history
        if ($request->user()->isReviewer()) {
            $versions = $asset->versions()
                ->with('uploader')
                ->where('version_number', $asset->current_version)
                ->get();
        } else {
            $versions = $asset->versions()
                ->with('uploader')
                ->orderBy('version_number', 'desc')
                ->get();
        }

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

        // Auto-complete linked requests when asset is approved
        foreach ($asset->creativeRequests as $creativeRequest) {
            if (!in_array($creativeRequest->status, ['completed', 'cancelled'])) {
                $creativeRequest->complete();
            }
        }

        // Send Discord notification
        $this->discord->notifyApproval($asset, $request->user());

        // Send in-app notification
        $this->notificationDispatcher->notifyAssetApproved($asset, $request->user());

        return response()->json($asset->fresh(['approvalLogs.user', 'creativeRequests']));
    }

    public function requestRevision(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('approve', $asset);

        $hasComments = Comment::where('asset_id', $asset->id)
            ->where('asset_version', $asset->current_version)
            ->exists();

        $validated = $request->validate([
            'comment' => [$hasComments ? 'nullable' : 'required', 'string'],
        ]);

        $asset->update(['status' => 'revision_requested']);

        ApprovalLog::create([
            'asset_id' => $asset->id,
            'asset_version' => $asset->current_version,
            'user_id' => $request->user()->id,
            'action' => 'revision_requested',
            'comment' => $validated['comment'] ?? null,
        ]);

        // Send Discord notification
        $this->discord->notifyRevisionRequested($asset, $request->user(), $validated['comment'] ?? null);

        // Send in-app notification
        $this->notificationDispatcher->notifyRevisionRequested($asset, $request->user(), $validated['comment'] ?? null);

        return response()->json($asset->fresh(['approvalLogs.user']));
    }

    public function sendToClientReview(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('approve', $asset);

        // Only PM/Admin can send to client (not reviewers)
        if (!$request->user()->isAdmin() && !$request->user()->isPM()) {
            abort(403, 'Only PM or Admin can send assets to client review.');
        }

        $asset->update(['status' => 'client_review']);

        // Notify reviewer members that asset is ready for review
        $this->notificationDispatcher->notifySentToClient($asset, $request->user());

        return response()->json($asset->load(['uploader', 'project']));
    }

    public function linkRequest(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('update', $asset);

        $validated = $request->validate([
            'request_id' => 'required|uuid|exists:creative_requests,id',
        ]);

        $asset->creativeRequests()->syncWithoutDetaching([$validated['request_id']]);

        // Update request status and auto-assign if needed
        $creativeRequest = CreativeRequest::find($validated['request_id']);
        if ($creativeRequest) {
            $updates = [];

            // Auto-assign uploader if request has no assignee
            if ($creativeRequest->assigned_to === null) {
                $updates['assigned_to'] = $request->user()->id;
            }

            // Update status if in progress
            if ($creativeRequest->status === 'in_progress') {
                $updates['status'] = 'asset_submitted';
            }

            if (!empty($updates)) {
                $creativeRequest->update($updates);
            }
        }

        return response()->json($asset->fresh('creativeRequests'));
    }

    public function lock(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('lock', $asset);

        if ($asset->is_locked) {
            return response()->json([
                'message' => 'Asset is already locked.',
            ], 422);
        }

        $validated = $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $asset->lock($request->user(), $validated['reason'] ?? null);

        return response()->json($asset->fresh(['locker', 'versionLocks.user']));
    }

    public function unlock(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('lock', $asset);

        if (!$asset->is_locked) {
            return response()->json([
                'message' => 'Asset is not locked.',
            ], 422);
        }

        $validated = $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $asset->unlock($request->user(), $validated['reason'] ?? null);

        return response()->json($asset->fresh(['locker', 'versionLocks.user']));
    }

    public function download(Request $request, Asset $asset, ?int $version = null): JsonResponse
    {
        $this->authorize('download', $asset);

        // Get the requested version or latest
        $versionNumber = $version ?? $asset->current_version;
        $assetVersion = $asset->versions()->where('version_number', $versionNumber)->first();

        if (!$assetVersion) {
            return response()->json([
                'message' => 'Version not found.',
            ], 404);
        }

        // Generate standardized filename: {asset_title}_v{version}.{ext}
        $extension = $assetVersion->file_meta['extension'] ?? 'bin';
        $safeTitle = preg_replace('/[^a-zA-Z0-9_-]/', '_', $asset->title);
        $filename = "{$safeTitle}_v{$versionNumber}.{$extension}";

        // Generate a temporary signed URL for download
        $url = $assetVersion->file_url;

        return response()->json([
            'url' => $url,
            'filename' => $filename,
            'version' => $versionNumber,
            'file_size' => $assetVersion->file_size,
        ]);
    }

    public function history(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('view', $asset);

        $user = $request->user();
        $isReviewer = $user->isReviewer();

        // Reviewers only see current version, own approval logs, no lock events
        $versionsQuery = $asset->versions()->with('uploader');
        if ($isReviewer) {
            $versionsQuery->where('version_number', $asset->current_version);
        }

        $versions = $versionsQuery
            ->orderBy('version_number', 'desc')
            ->get()
            ->map(function ($version) {
                return [
                    'id' => $version->id,
                    'version_number' => $version->version_number,
                    'file_url' => $version->file_url,
                    'file_size' => $version->file_size,
                    'file_size_formatted' => $version->file_size_formatted,
                    'file_meta' => $version->file_meta,
                    'thumbnail_url' => $version->thumbnail_url,
                    'version_notes' => $version->version_notes,
                    'uploaded_by' => $version->uploader,
                    'created_at' => $version->created_at,
                ];
            });

        // Get approval logs for timeline (reviewers only see own)
        $approvalLogsQuery = $asset->approvalLogs()->with('user');
        if ($isReviewer) {
            $approvalLogsQuery->where('user_id', $user->id);
        }

        $approvalLogs = $approvalLogsQuery
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'type' => 'approval',
                    'action' => $log->action,
                    'asset_version' => $log->asset_version,
                    'user' => $log->user,
                    'comment' => $log->comment,
                    'created_at' => $log->created_at,
                ];
            });

        // Get lock/unlock events for timeline (not for reviewers)
        $lockEvents = collect();
        if (!$isReviewer) {
            $lockEvents = $asset->versionLocks()
                ->with('user')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($lock) {
                    return [
                        'id' => $lock->id,
                        'type' => 'lock',
                        'action' => $lock->action,
                        'user' => $lock->user,
                        'reason' => $lock->reason,
                        'created_at' => $lock->created_at,
                    ];
                });
        }

        // Merge and sort all events by created_at descending
        $timeline = collect()
            ->concat($versions->map(fn($v) => array_merge($v, ['type' => 'version'])))
            ->concat($approvalLogs)
            ->concat($lockEvents)
            ->sortByDesc('created_at')
            ->values();

        return response()->json([
            'versions' => $versions,
            'timeline' => $timeline,
            'is_locked' => $isReviewer ? false : $asset->is_locked, // Hide lock status from reviewers
            'locked_by' => $isReviewer ? null : $asset->locker,
            'locked_at' => $isReviewer ? null : $asset->locked_at,
        ]);
    }
}
