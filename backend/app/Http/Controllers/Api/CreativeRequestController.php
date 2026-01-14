<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CreativeRequest;
use App\Models\Project;
use App\Models\RequestAttachment;
use App\Services\DiscordNotificationService;
use App\Services\FileUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CreativeRequestController extends Controller
{
    public function __construct(
        protected FileUploadService $uploadService,
        protected DiscordNotificationService $discord
    ) {}

    public function index(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $query = $project->creativeRequests()
            ->with(['creator', 'assignee', 'assets'])
            ->forUser($request->user());

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->has('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        $requests = $query->orderBy('deadline', 'asc')->paginate(20);

        return response()->json($requests);
    }

    public function myQueue(Request $request): JsonResponse
    {
        $query = CreativeRequest::with(['creator', 'project', 'assets'])
            ->where('assigned_to', $request->user()->id)
            ->where('status', '!=', 'completed');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $requests = $query->orderBy('deadline', 'asc')->paginate(20);

        return response()->json($requests);
    }

    public function store(Request $request, Project $project): JsonResponse
    {
        $this->authorize('createRequest', $project);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'assigned_to' => 'required|uuid|exists:users,id',
            'deadline' => 'required|date|after:now',
            'priority' => 'sometimes|in:low,normal,high,urgent',
            'specs' => 'nullable|array',
        ]);

        $creativeRequest = CreativeRequest::create([
            'project_id' => $project->id,
            'created_by' => $request->user()->id,
            'status' => 'pending',
            'priority' => $validated['priority'] ?? 'normal',
            ...$validated,
        ]);

        // Send Discord notification
        $this->discord->notifyNewRequest($creativeRequest);

        return response()->json($creativeRequest->load(['creator', 'assignee', 'project']), 201);
    }

    public function show(Request $request, CreativeRequest $creativeRequest): JsonResponse
    {
        $this->authorize('view', $creativeRequest);

        $creativeRequest->load([
            'creator',
            'assignee',
            'project',
            'attachments.uploader',
            'assets.uploader',
            'assets.latestVersion',
        ]);

        return response()->json($creativeRequest);
    }

    public function update(Request $request, CreativeRequest $creativeRequest): JsonResponse
    {
        $this->authorize('update', $creativeRequest);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'assigned_to' => 'sometimes|uuid|exists:users,id',
            'deadline' => 'sometimes|date',
            'priority' => 'sometimes|in:low,normal,high,urgent',
            'specs' => 'nullable|array',
            'status' => 'sometimes|in:pending,in_progress,asset_submitted,completed',
        ]);

        $creativeRequest->update($validated);

        return response()->json($creativeRequest->fresh(['creator', 'assignee']));
    }

    public function destroy(Request $request, CreativeRequest $creativeRequest): JsonResponse
    {
        $this->authorize('delete', $creativeRequest);

        // Delete attachments
        foreach ($creativeRequest->attachments as $attachment) {
            $this->uploadService->delete($attachment->file_url);
        }

        $creativeRequest->delete();

        return response()->json(['message' => 'Request deleted successfully']);
    }

    public function start(Request $request, CreativeRequest $creativeRequest): JsonResponse
    {
        $this->authorize('start', $creativeRequest);

        $creativeRequest->start();

        return response()->json($creativeRequest->fresh(['creator', 'assignee']));
    }

    public function complete(Request $request, CreativeRequest $creativeRequest): JsonResponse
    {
        $this->authorize('complete', $creativeRequest);

        $creativeRequest->complete();

        return response()->json($creativeRequest->fresh(['creator', 'assignee']));
    }

    public function addAttachment(Request $request, CreativeRequest $creativeRequest): JsonResponse
    {
        $this->authorize('update', $creativeRequest);

        $request->validate([
            'file' => 'required|file|max:51200',
        ]);

        $file = $request->file('file');
        $uploadResult = $this->uploadService->upload($file, "requests/{$creativeRequest->id}");

        $attachment = RequestAttachment::create([
            'request_id' => $creativeRequest->id,
            'file_url' => $uploadResult['url'],
            'file_name' => $file->getClientOriginalName(),
            'uploaded_by' => $request->user()->id,
        ]);

        return response()->json($attachment->load('uploader'), 201);
    }

    public function removeAttachment(Request $request, CreativeRequest $creativeRequest, RequestAttachment $attachment): JsonResponse
    {
        $this->authorize('update', $creativeRequest);

        $this->uploadService->delete($attachment->file_url);
        $attachment->delete();

        return response()->json(['message' => 'Attachment removed successfully']);
    }
}
