<?php

namespace App\Http\Controllers\Api;

use App\Enums\Priority;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreativeRequestAddAttachmentRequest;
use App\Http\Requests\CreativeRequestStoreRequest;
use App\Http\Requests\CreativeRequestUpdateRequest;
use App\Models\CreativeRequest;
use App\Models\Project;
use App\Models\RequestAttachment;
use App\Models\User;
use App\Services\DiscordNotificationService;
use App\Services\FileUploadService;
use App\Services\NotificationDispatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CreativeRequestController extends Controller
{
    public function __construct(
        protected FileUploadService $uploadService,
        protected DiscordNotificationService $discord,
        protected NotificationDispatcher $notificationDispatcher
    ) {}

    public function listAll(Request $request): JsonResponse
    {
        $user = $request->user();

        // Reviewers cannot access creative requests (internal workflow)
        if ($user->isReviewer()) {
            return response()->json(['data' => [], 'total' => 0]);
        }

        // Get projects the user has access to
        $projectIds = $user->isAdmin()
            ? Project::pluck('id')
            : $user->projects()->pluck('projects.id');

        $query = CreativeRequest::whereIn('project_id', $projectIds)
            ->with(['creator', 'assignee', 'project', 'assets']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->has('assigned_to')) {
            if ($request->assigned_to === 'me') {
                $query->where('assigned_to', $user->id);
            } else {
                $query->where('assigned_to', $request->assigned_to);
            }
        }

        if ($request->has('filter')) {
            if ($request->filter === 'overdue') {
                $query->where('deadline', '<', now())
                      ->where('status', '!=', 'completed');
            }
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('project', function ($pq) use ($search) {
                      $pq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $requests = $query->orderBy('deadline', 'asc')->paginate(20);

        return response()->json($requests);
    }

    public function index(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        // Reviewers cannot access creative requests (internal workflow)
        if ($request->user()->isReviewer()) {
            return response()->json(['data' => [], 'total' => 0]);
        }

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
            ->where(function ($q) use ($request) {
                $q->where('assigned_to', $request->user()->id)
                  ->orWhereNull('assigned_to');
            })
            ->active();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $requests = $query->orderBy('deadline', 'asc')->paginate(20);

        return response()->json($requests);
    }

    public function store(CreativeRequestStoreRequest $request, Project $project): JsonResponse
    {
        $this->authorize('createRequest', $project);

        $validated = $request->validated();

        $creativeRequest = CreativeRequest::create([
            'project_id' => $project->id,
            'created_by' => $request->user()->id,
            'status' => 'pending',
            'priority' => $validated['priority'] ?? 'normal',
            ...$validated,
        ]);

        // Send Discord notification
        $this->discord->notifyNewRequest($creativeRequest);

        // Send in-app notification if assigned
        if ($creativeRequest->assigned_to) {
            // Load assignee relationship if not already loaded
            $creativeRequest->load('assignee');
            if ($creativeRequest->assignee) {
                $this->notificationDispatcher->notifyRequestAssigned($creativeRequest, $creativeRequest->assignee, $request->user());
            }
        }

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
            'assets.latest_version',
        ]);

        return response()->json($creativeRequest);
    }

    public function update(CreativeRequestUpdateRequest $request, CreativeRequest $creativeRequest): JsonResponse
    {
        $this->authorize('update', $creativeRequest);

        $validated = $request->validated();

        $oldStatus = $creativeRequest->status;
        $oldAssignee = $creativeRequest->assigned_to;

        $creativeRequest->update($validated);

        // Notify on assignment change
        if (isset($validated['assigned_to']) && $validated['assigned_to'] !== $oldAssignee) {
            // Refresh the assignee relationship after update
            $creativeRequest->load('assignee');
            if ($creativeRequest->assignee) {
                $this->notificationDispatcher->notifyRequestAssigned($creativeRequest, $creativeRequest->assignee, $request->user());
            }
        }

        // Notify on status change
        if (isset($validated['status']) && $validated['status'] !== $oldStatus) {
            $this->notificationDispatcher->notifyRequestStatusChanged($creativeRequest, $oldStatus, $request->user());
        }

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

        $user = $request->user();
        $oldStatus = $creativeRequest->status;
        $wasUnassigned = $creativeRequest->assigned_to === null;

        // Auto-assign if unassigned
        if ($wasUnassigned) {
            $creativeRequest->update(['assigned_to' => $user->id]);
        }

        // Add user as project member if not already
        $project = $creativeRequest->project;
        if (!$project->isMember($user)) {
            $project->members()->attach($user->id, [
                'id' => \Illuminate\Support\Str::uuid(),
                'role_in_project' => 'member',
            ]);
        }

        $creativeRequest->start();

        // Notify status change
        $this->notificationDispatcher->notifyRequestStatusChanged($creativeRequest, $oldStatus, $user);

        return response()->json($creativeRequest->fresh(['creator', 'assignee']));
    }

    public function complete(Request $request, CreativeRequest $creativeRequest): JsonResponse
    {
        $this->authorize('complete', $creativeRequest);

        $oldStatus = $creativeRequest->status;
        $creativeRequest->complete();

        // Notify status change
        $this->notificationDispatcher->notifyRequestStatusChanged($creativeRequest, $oldStatus, $request->user());

        return response()->json($creativeRequest->fresh(['creator', 'assignee']));
    }

    public function addAttachment(CreativeRequestAddAttachmentRequest $request, CreativeRequest $creativeRequest): JsonResponse
    {
        $this->authorize('update', $creativeRequest);

        $request->validated();

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
