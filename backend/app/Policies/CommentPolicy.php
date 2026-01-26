<?php

namespace App\Policies;

use App\Models\Comment;
use App\Models\User;

class CommentPolicy
{
    public function update(User $user, Comment $comment): bool
    {
        return $comment->user_id === $user->id;
    }

    /**
     * Determine if the user can manage media on the comment.
     * This is separate from update because we want admins to be able to
     * remove images from any comment, but not change the comment text.
     */
    public function manageMedia(User $user, Comment $comment): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $comment->user_id === $user->id;
    }

    public function delete(User $user, Comment $comment): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($comment->user_id === $user->id) {
            return true;
        }

        if ($user->isPM()) {
            return $comment->asset->project->members()
                ->where('users.id', $user->id)
                ->exists();
        }

        return false;
    }

    public function resolve(User $user, Comment $comment): bool
    {
        if ($user->isAdmin() || $user->isPM() || $user->isReviewer()) {
            return $comment->asset->project->members()
                ->where('users.id', $user->id)
                ->exists();
        }

        // Creatives can resolve comments on their own assets
        if ($user->isCreative()) {
            return $comment->asset->uploaded_by === $user->id;
        }

        return false;
    }
}
