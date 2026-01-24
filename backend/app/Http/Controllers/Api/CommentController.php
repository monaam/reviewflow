<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Comment;
use App\Models\User;
use App\Services\DiscordNotificationService;
use App\Services\MentionParser;
use App\Services\NotificationDispatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function __construct(
        protected DiscordNotificationService $discord,
        protected NotificationDispatcher $notificationDispatcher,
        protected MentionParser $mentionParser
    ) {}

    public function index(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('view', $asset);

        // If timeline mode is requested, return unified timeline
        if ($request->boolean('timeline')) {
            return $this->getTimeline($request, $asset);
        }

        $query = $asset->comments()
            ->with(['user', 'resolver', 'mentions', 'replies.user', 'replies.resolver', 'replies.mentions'])
            ->whereNull('parent_id'); // Only top-level comments

        // Reviewers only see their own comments and replies to their comments
        if ($request->user()->isReviewer()) {
            $query->where('user_id', $request->user()->id);
        }

        if ($request->has('version')) {
            $query->where('asset_version', $request->version);
        } elseif (!$request->boolean('all')) {
            $query->where('asset_version', $asset->current_version);
        }

        if ($request->has('resolved')) {
            $query->where('is_resolved', $request->boolean('resolved'));
        }

        $comments = $query->orderBy('created_at', 'asc')->get();

        return response()->json($comments);
    }

    protected function getTimeline(Request $request, Asset $asset): JsonResponse
    {
        $timeline = collect();
        $user = $request->user();

        // Get comments (only top-level, with replies nested)
        $commentsQuery = $asset->comments()
            ->with(['user', 'resolver', 'mentions', 'replies.user', 'replies.resolver', 'replies.mentions'])
            ->whereNull('parent_id'); // Only top-level comments

        // Reviewers only see their own comments and replies to their comments
        if ($user->isReviewer()) {
            $commentsQuery->where('user_id', $user->id);
        }

        if ($request->has('version')) {
            $commentsQuery->where('asset_version', $request->version);
        } elseif (!$request->boolean('all')) {
            $commentsQuery->where('asset_version', $asset->current_version);
        }
        $comments = $commentsQuery->get()->map(fn($c) => [
            'type' => 'comment',
            'id' => $c->id,
            'created_at' => $c->created_at,
            'data' => $c,
        ]);
        $timeline = $timeline->merge($comments);

        // Get versions (only if showing all or no specific version filter)
        // Reviewers don't see version history - they only see current version
        if (!$user->isReviewer() && ($request->boolean('all') || !$request->has('version'))) {
            $versions = $asset->versions()->with('uploader')->get()->map(fn($v) => [
                'type' => 'version',
                'id' => 'version-' . $v->id,
                'created_at' => $v->created_at,
                'data' => $v,
            ]);
            $timeline = $timeline->merge($versions);
        }

        // Get approval logs
        // Reviewers only see their own approval actions
        $approvalLogsQuery = $asset->approvalLogs()->with('user');
        if ($user->isReviewer()) {
            $approvalLogsQuery->where('user_id', $user->id);
        }
        if ($request->has('version')) {
            $approvalLogsQuery->where('asset_version', $request->version);
        }
        $approvalLogs = $approvalLogsQuery->get()->map(fn($a) => [
            'type' => 'approval',
            'id' => 'approval-' . $a->id,
            'created_at' => $a->created_at,
            'data' => $a,
        ]);
        $timeline = $timeline->merge($approvalLogs);

        // Sort by created_at
        $timeline = $timeline->sortBy('created_at')->values();

        return response()->json($timeline);
    }

    public function store(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('comment', $asset);

        $validated = $request->validate([
            'content' => 'required|string|max:5000',
            'rectangle' => 'nullable|array',
            'rectangle.x' => 'required_with:rectangle|numeric|min:0|max:1',
            'rectangle.y' => 'required_with:rectangle|numeric|min:0|max:1',
            'rectangle.width' => 'required_with:rectangle|numeric|min:0|max:1',
            'rectangle.height' => 'required_with:rectangle|numeric|min:0|max:1',
            'video_timestamp' => 'nullable|numeric|min:0',
            'page_number' => 'nullable|integer|min:1',
            'parent_id' => 'nullable|uuid|exists:comments,id',
        ]);

        // If replying to a comment, validate the parent
        $parentComment = null;
        if (!empty($validated['parent_id'])) {
            $parentComment = Comment::find($validated['parent_id']);

            // Ensure parent belongs to the same asset
            if ($parentComment->asset_id !== $asset->id) {
                return response()->json([
                    'message' => 'Parent comment does not belong to this asset.',
                ], 422);
            }

            // Ensure single-level threading (parent cannot be a reply)
            if ($parentComment->isReply()) {
                return response()->json([
                    'message' => 'Cannot reply to a reply. Only single-level threading is supported.',
                ], 422);
            }
        }

        // For replies: inherit asset_version from parent, no annotations
        $isReply = $parentComment !== null;

        $comment = Comment::create([
            'asset_id' => $asset->id,
            'asset_version' => $isReply ? $parentComment->asset_version : $asset->current_version,
            'user_id' => $request->user()->id,
            'parent_id' => $validated['parent_id'] ?? null,
            'content' => $validated['content'],
            // Replies do NOT have annotations
            'rectangle' => $isReply ? null : ($validated['rectangle'] ?? null),
            'video_timestamp' => $isReply ? null : ($validated['video_timestamp'] ?? null),
            'page_number' => $isReply ? null : ($validated['page_number'] ?? null),
        ]);

        // Parse mentions from content and create mention records
        $mentionedUserIds = $this->mentionParser->extractMentionedUserIds($validated['content']);
        $mentionedUsers = collect();

        if (!empty($mentionedUserIds)) {
            // Get valid users who have access to this project (members + admins)
            $projectMemberIds = $asset->project->members()->pluck('users.id');
            $adminIds = User::where('role', 'admin')->pluck('id');
            $validUserIds = $projectMemberIds->merge($adminIds)->unique()->toArray();

            $validMentionIds = array_intersect($mentionedUserIds, $validUserIds);

            if (!empty($validMentionIds)) {
                $comment->mentions()->attach($validMentionIds);
                $mentionedUsers = User::whereIn('id', $validMentionIds)->get();
            }
        }

        // Send Discord notification
        $this->discord->notifyNewComment($comment);

        // Send in-app notification
        $this->notificationDispatcher->notifyCommentCreated($comment, $request->user());

        // Send mention notifications
        if ($mentionedUsers->isNotEmpty()) {
            $this->notificationDispatcher->notifyMentionedUsers($comment, $mentionedUsers, $request->user());
        }

        return response()->json($comment->load(['user', 'mentions']), 201);
    }

    public function update(Request $request, Comment $comment): JsonResponse
    {
        $this->authorize('update', $comment);

        $validated = $request->validate([
            'content' => 'required|string|max:5000',
        ]);

        $comment->update([
            'content' => $validated['content'],
        ]);

        return response()->json($comment->fresh(['user', 'mentions']));
    }

    public function destroy(Request $request, Comment $comment): JsonResponse
    {
        $this->authorize('delete', $comment);

        $comment->delete();

        return response()->json(['message' => 'Comment deleted successfully']);
    }

    public function resolve(Request $request, Comment $comment): JsonResponse
    {
        $this->authorize('resolve', $comment);

        $comment->resolve($request->user());

        return response()->json($comment->fresh(['user', 'resolver']));
    }

    public function unresolve(Request $request, Comment $comment): JsonResponse
    {
        $this->authorize('resolve', $comment);

        $comment->unresolve();

        return response()->json($comment->fresh(['user', 'resolver']));
    }

    public function mentionableUsers(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('view', $asset);

        // Get project member IDs
        $memberIds = $asset->project->members()->pluck('users.id');

        // Get all admin IDs (admins have access to all projects)
        $adminIds = User::where('role', 'admin')->pluck('id');

        // Merge and get unique user IDs
        $userIds = $memberIds->merge($adminIds)->unique();

        // Query users with optional search filter
        $query = User::whereIn('id', $userIds)
            ->where('is_active', true);

        if ($request->has('search') && $request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $users = $query->select('id', 'name', 'avatar')
            ->orderBy('name')
            ->limit(20)
            ->get();

        return response()->json($users);
    }
}
