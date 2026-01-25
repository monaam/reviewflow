<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Reviewers have restricted view - no members, no request counts
        if ($user->isReviewer()) {
            $query = Project::with(['creator'])
                ->forUser($user)
                ->withCount([
                    'assets' => fn($q) => $q->whereIn('status', ['client_review', 'approved', 'revision_requested']),
                ]);
        } else {
            $query = Project::with(['creator', 'members'])
                ->forUser($user)
                ->withCount(['assets', 'creativeRequests']);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $projects = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($projects);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Project::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'client_name' => 'nullable|string|max:255',
            'deadline' => 'nullable|date',
            'cover_image' => 'nullable|string',
        ]);

        $project = Project::create([
            ...$validated,
            'created_by' => $request->user()->id,
            'status' => 'active',
        ]);

        // Add creator as owner member
        ProjectMember::create([
            'project_id' => $project->id,
            'user_id' => $request->user()->id,
            'role_in_project' => 'owner',
        ]);

        return response()->json($project->load(['creator', 'members']), 201);
    }

    public function show(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $user = $request->user();

        // Reviewers have restricted view - no members, no requests, filtered assets
        if ($user->isReviewer()) {
            $project->load([
                'creator',
                'assets' => fn($q) => $q->with(['uploader', 'latest_version'])
                    ->whereIn('status', ['client_review', 'approved', 'revision_requested'])
                    ->latest(),
            ]);

            $project->loadCount([
                'assets' => fn($q) => $q->whereIn('status', ['client_review', 'approved', 'revision_requested']),
            ]);

            // Remove members from response
            $project->setRelation('members', collect());
            $project->creative_requests_count = 0;
        } else {
            $project->load([
                'creator',
                'members',
                'assets' => fn($q) => $q->with(['uploader', 'latest_version'])->latest(),
                'creativeRequests' => fn($q) => $q->with(['creator', 'assignee'])->latest(),
            ]);

            $project->loadCount(['assets', 'creativeRequests']);
        }

        return response()->json($project);
    }

    public function update(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'client_name' => 'nullable|string|max:255',
            'deadline' => 'nullable|date',
            'cover_image' => 'nullable|string',
            'status' => 'sometimes|in:active,on_hold,completed,archived',
        ]);

        $project->update($validated);

        return response()->json($project->fresh(['creator', 'members']));
    }

    public function destroy(Request $request, Project $project): JsonResponse
    {
        $this->authorize('delete', $project);

        $project->delete();

        return response()->json(['message' => 'Project deleted successfully']);
    }

    public function addMember(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'user_id' => 'required|uuid|exists:users,id',
            'role_in_project' => 'sometimes|in:owner,member',
        ]);

        $member = ProjectMember::updateOrCreate(
            [
                'project_id' => $project->id,
                'user_id' => $validated['user_id'],
            ],
            [
                'role_in_project' => $validated['role_in_project'] ?? 'member',
            ]
        );

        return response()->json($member->load('user'), 201);
    }

    public function removeMember(Request $request, Project $project, User $user): JsonResponse
    {
        $this->authorize('update', $project);

        ProjectMember::where('project_id', $project->id)
            ->where('user_id', $user->id)
            ->delete();

        return response()->json(['message' => 'Member removed successfully']);
    }

    public function members(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        // Reviewers cannot see project members (internal team info)
        if ($request->user()->isReviewer()) {
            abort(403, 'You do not have permission to view project members.');
        }

        $members = $project->members()->get();

        return response()->json($members);
    }
}
