<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Comment;
use App\Services\DiscordNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function __construct(
        protected DiscordNotificationService $discord
    ) {}

    public function index(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('view', $asset);

        // If timeline mode is requested, return unified timeline
        if ($request->boolean('timeline')) {
            return $this->getTimeline($request, $asset);
        }

        $query = $asset->comments()->with(['user', 'resolver']);

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

        // Get comments
        $commentsQuery = $asset->comments()->with(['user', 'resolver']);
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
        if ($request->boolean('all') || !$request->has('version')) {
            $versions = $asset->versions()->with('uploader')->get()->map(fn($v) => [
                'type' => 'version',
                'id' => 'version-' . $v->id,
                'created_at' => $v->created_at,
                'data' => $v,
            ]);
            $timeline = $timeline->merge($versions);
        }

        // Get approval logs
        $approvalLogsQuery = $asset->approvalLogs()->with('user');
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
        ]);

        $comment = Comment::create([
            'asset_id' => $asset->id,
            'asset_version' => $asset->current_version,
            'user_id' => $request->user()->id,
            'content' => $validated['content'],
            'rectangle' => $validated['rectangle'] ?? null,
            'video_timestamp' => $validated['video_timestamp'] ?? null,
        ]);

        // Send Discord notification
        $this->discord->notifyNewComment($comment);

        return response()->json($comment->load('user'), 201);
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

        return response()->json($comment->fresh('user'));
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
}
