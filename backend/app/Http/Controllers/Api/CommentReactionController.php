<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\CommentReaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentReactionController extends Controller
{
    public function toggle(Request $request, Comment $comment): JsonResponse
    {
        $request->validate([
            'emoji' => 'required|string|max:20',
        ]);

        $existing = CommentReaction::where('comment_id', $comment->id)
            ->where('user_id', $request->user()->id)
            ->where('emoji', $request->emoji)
            ->first();

        if ($existing) {
            $existing->delete();
        } else {
            CommentReaction::create([
                'comment_id' => $comment->id,
                'user_id' => $request->user()->id,
                'emoji' => $request->emoji,
            ]);
        }

        $reactions = $comment->reactions()->with('user:id,name')->get();

        return response()->json($reactions);
    }
}
