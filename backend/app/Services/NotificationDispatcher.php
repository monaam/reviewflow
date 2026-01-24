<?php

namespace App\Services;

use App\Models\Asset;
use App\Models\Comment;
use App\Models\CreativeRequest;
use App\Models\User;
use App\Notifications\AssetApprovedNotification;
use App\Notifications\AssetUploadedNotification;
use App\Notifications\CommentReplyNotification;
use App\Notifications\MentionNotification;
use App\Notifications\NewCommentNotification;
use App\Notifications\NewVersionNotification;
use App\Notifications\RequestAssignedNotification;
use App\Notifications\RequestStatusChangedNotification;
use App\Notifications\RevisionRequestedNotification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Notification;

class NotificationDispatcher
{
    public function notifyCommentCreated(Comment $comment, User $actor): void
    {
        if ($comment->parent_id) {
            $this->notifyCommentReply($comment, $actor);
            return;
        }

        $asset = $comment->asset;
        $project = $asset->project;

        // Get project members with notify_on_comment enabled (excluding actor)
        $recipients = $project->members()
            ->where('users.id', '!=', $actor->id)
            ->wherePivot('notify_on_comment', true)
            ->get();

        // Also notify asset uploader if not actor and not already in recipients
        if ($asset->uploaded_by !== $actor->id) {
            $uploader = User::find($asset->uploaded_by);
            if ($uploader && !$recipients->contains('id', $uploader->id)) {
                $recipients->push($uploader);
            }
        }

        if ($recipients->isNotEmpty()) {
            Notification::send($recipients, new NewCommentNotification($comment, $actor));
        }
    }

    public function notifyCommentReply(Comment $reply, User $actor): void
    {
        $parentComment = $reply->parent;

        // Don't notify if replying to own comment
        if (!$parentComment || $parentComment->user_id === $actor->id) {
            return;
        }

        $parentComment->user->notify(new CommentReplyNotification($reply, $actor));
    }

    public function notifyAssetUploaded(Asset $asset, User $uploader): void
    {
        $project = $asset->project;

        $recipients = $project->members()
            ->where('users.id', '!=', $uploader->id)
            ->wherePivot('notify_on_upload', true)
            ->get();

        if ($recipients->isNotEmpty()) {
            Notification::send($recipients, new AssetUploadedNotification($asset, $uploader));
        }
    }

    public function notifyNewVersion(Asset $asset, User $uploader): void
    {
        $project = $asset->project;

        $recipients = $project->members()
            ->where('users.id', '!=', $uploader->id)
            ->wherePivot('notify_on_upload', true)
            ->get();

        if ($recipients->isNotEmpty()) {
            Notification::send($recipients, new NewVersionNotification($asset, $uploader));
        }
    }

    public function notifyAssetApproved(Asset $asset, User $approver): void
    {
        $project = $asset->project;

        $recipients = $project->members()
            ->where('users.id', '!=', $approver->id)
            ->wherePivot('notify_on_approval', true)
            ->get();

        // Always notify uploader
        if ($asset->uploaded_by !== $approver->id) {
            $uploader = User::find($asset->uploaded_by);
            if ($uploader && !$recipients->contains('id', $uploader->id)) {
                $recipients->push($uploader);
            }
        }

        if ($recipients->isNotEmpty()) {
            Notification::send($recipients, new AssetApprovedNotification($asset, $approver));
        }
    }

    public function notifyRevisionRequested(Asset $asset, User $reviewer, ?string $feedback = null): void
    {
        // Notify asset uploader
        if ($asset->uploaded_by === $reviewer->id) {
            return;
        }

        $uploader = User::find($asset->uploaded_by);
        $uploader?->notify(new RevisionRequestedNotification($asset, $reviewer, $feedback));
    }

    public function notifyRequestAssigned(CreativeRequest $request, User $assignee, ?User $assigner = null): void
    {
        if ($assigner && $assigner->id === $assignee->id) {
            return;
        }

        $assignee->notify(new RequestAssignedNotification($request, $assigner));
    }

    public function notifyRequestStatusChanged(CreativeRequest $request, string $oldStatus, User $actor): void
    {
        $recipients = collect();

        // Notify assignee if not actor
        if ($request->assigned_to && $request->assigned_to !== $actor->id) {
            $assignee = User::find($request->assigned_to);
            if ($assignee) {
                $recipients->push($assignee);
            }
        }

        // Notify creator if not actor
        if ($request->created_by !== $actor->id) {
            $creator = User::find($request->created_by);
            if ($creator && !$recipients->contains('id', $creator->id)) {
                $recipients->push($creator);
            }
        }

        $recipients = $recipients->filter();

        if ($recipients->isNotEmpty()) {
            Notification::send($recipients, new RequestStatusChangedNotification($request, $oldStatus, $actor));
        }
    }

    public function notifyMentionedUsers(Comment $comment, Collection $mentionedUsers, User $actor): void
    {
        $asset = $comment->asset;
        $project = $asset->project;

        // Start with all mentioned users, excluding the actor
        $recipients = $mentionedUsers->filter(fn($user) => $user->id !== $actor->id);

        // If this is a reply, exclude the parent comment author (they get CommentReplyNotification)
        if ($comment->parent_id && $comment->parent) {
            $recipients = $recipients->filter(fn($user) => $user->id !== $comment->parent->user_id);
        }

        // For top-level comments, exclude users who will receive NewCommentNotification
        if (!$comment->parent_id) {
            // Get users who would receive NewCommentNotification
            $newCommentRecipientIds = $project->members()
                ->where('users.id', '!=', $actor->id)
                ->wherePivot('notify_on_comment', true)
                ->pluck('users.id')
                ->toArray();

            // Also include uploader in exclusion if they would receive notification
            if ($asset->uploaded_by !== $actor->id) {
                $newCommentRecipientIds[] = $asset->uploaded_by;
            }

            $recipients = $recipients->filter(fn($user) => !in_array($user->id, $newCommentRecipientIds));
        }

        if ($recipients->isNotEmpty()) {
            Notification::send($recipients, new MentionNotification($comment, $actor));
        }
    }
}
