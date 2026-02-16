<?php

namespace Tests\Unit\Services;

use App\Models\Asset;
use App\Models\Comment;
use App\Models\CreativeRequest;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use App\Notifications\AssetApprovedNotification;
use App\Notifications\AssetSentToClientNotification;
use App\Notifications\AssetUploadedNotification;
use App\Notifications\CommentReplyNotification;
use App\Notifications\MentionNotification;
use App\Notifications\NewCommentNotification;
use App\Notifications\NewVersionNotification;
use App\Notifications\RequestAssignedNotification;
use App\Notifications\RequestStatusChangedNotification;
use App\Notifications\RevisionRequestedNotification;
use App\Services\NotificationDispatcher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class NotificationDispatcherTest extends TestCase
{
    use RefreshDatabase;

    private NotificationDispatcher $dispatcher;
    private User $admin;
    private User $pm;
    private User $creative;
    private User $reviewer;
    private Project $project;
    private Asset $asset;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();

        $this->dispatcher = new NotificationDispatcher();
        $this->admin = User::factory()->admin()->create();
        $this->pm = User::factory()->pm()->create();
        $this->creative = User::factory()->creative()->create();
        $this->reviewer = User::factory()->reviewer()->create();

        $this->project = Project::factory()->create(['created_by' => $this->pm->id]);
        ProjectMember::factory()->owner()->create([
            'project_id' => $this->project->id,
            'user_id' => $this->pm->id,
        ]);

        $this->asset = Asset::factory()->create([
            'project_id' => $this->project->id,
            'uploaded_by' => $this->creative->id,
        ]);
    }

    private function addMember(User $user, array $pivotOverrides = []): void
    {
        ProjectMember::factory()->create(array_merge([
            'project_id' => $this->project->id,
            'user_id' => $user->id,
        ], $pivotOverrides));
    }

    // notifyAssetUploaded

    public function test_asset_uploaded_sends_to_members_with_upload_pref(): void
    {
        $this->addMember($this->creative, ['notify_on_upload' => true]);

        $this->dispatcher->notifyAssetUploaded($this->asset, $this->pm);

        Notification::assertSentTo($this->creative, AssetUploadedNotification::class);
    }

    public function test_asset_uploaded_excludes_reviewers(): void
    {
        $this->addMember($this->reviewer, ['notify_on_upload' => true]);

        $this->dispatcher->notifyAssetUploaded($this->asset, $this->pm);

        Notification::assertNotSentTo($this->reviewer, AssetUploadedNotification::class);
    }

    public function test_asset_uploaded_excludes_uploader(): void
    {
        $this->addMember($this->creative, ['notify_on_upload' => true]);

        $this->dispatcher->notifyAssetUploaded($this->asset, $this->creative);

        Notification::assertNotSentTo($this->creative, AssetUploadedNotification::class);
    }

    // notifyNewVersion

    public function test_new_version_sends_to_members_excluding_reviewers(): void
    {
        $this->addMember($this->creative, ['notify_on_upload' => true]);
        $this->addMember($this->reviewer, ['notify_on_upload' => true]);

        $this->dispatcher->notifyNewVersion($this->asset, $this->pm);

        Notification::assertSentTo($this->creative, NewVersionNotification::class);
        Notification::assertNotSentTo($this->reviewer, NewVersionNotification::class);
    }

    // notifyAssetApproved

    public function test_asset_approved_sends_to_members_with_approval_pref(): void
    {
        $this->addMember($this->creative, ['notify_on_approval' => true]);

        $this->dispatcher->notifyAssetApproved($this->asset, $this->pm);

        Notification::assertSentTo($this->creative, AssetApprovedNotification::class);
    }

    public function test_asset_approved_excludes_approver(): void
    {
        $this->dispatcher->notifyAssetApproved($this->asset, $this->pm);

        Notification::assertNotSentTo($this->pm, AssetApprovedNotification::class);
    }

    // notifyRevisionRequested

    public function test_revision_requested_sends_to_uploader(): void
    {
        $this->dispatcher->notifyRevisionRequested($this->asset, $this->pm, 'Fix colors');

        Notification::assertSentTo($this->creative, RevisionRequestedNotification::class);
    }

    public function test_revision_requested_skips_if_reviewer_is_uploader(): void
    {
        $asset = Asset::factory()->create([
            'project_id' => $this->project->id,
            'uploaded_by' => $this->pm->id,
        ]);

        $this->dispatcher->notifyRevisionRequested($asset, $this->pm);

        Notification::assertNothingSent();
    }

    // notifySentToClient

    public function test_sent_to_client_sends_to_reviewer_members_only(): void
    {
        $this->addMember($this->reviewer);
        $this->addMember($this->creative);

        $this->dispatcher->notifySentToClient($this->asset, $this->pm);

        Notification::assertSentTo($this->reviewer, AssetSentToClientNotification::class);
        Notification::assertNotSentTo($this->creative, AssetSentToClientNotification::class);
        Notification::assertNotSentTo($this->pm, AssetSentToClientNotification::class);
    }

    // notifyCommentCreated

    public function test_comment_created_sends_to_members_with_comment_pref(): void
    {
        $this->addMember($this->creative, ['notify_on_comment' => true]);
        $comment = Comment::factory()->create([
            'asset_id' => $this->asset->id,
            'user_id' => $this->pm->id,
        ]);

        $this->dispatcher->notifyCommentCreated($comment, $this->pm);

        Notification::assertSentTo($this->creative, NewCommentNotification::class);
    }

    public function test_comment_created_delegates_to_reply_if_parent_id(): void
    {
        $parentComment = Comment::factory()->create([
            'asset_id' => $this->asset->id,
            'user_id' => $this->creative->id,
        ]);
        $reply = Comment::factory()->create([
            'asset_id' => $this->asset->id,
            'user_id' => $this->pm->id,
            'parent_id' => $parentComment->id,
        ]);

        $this->dispatcher->notifyCommentCreated($reply, $this->pm);

        Notification::assertSentTo($this->creative, CommentReplyNotification::class);
        Notification::assertNotSentTo($this->creative, NewCommentNotification::class);
    }

    public function test_comment_created_notifies_uploader(): void
    {
        // Creative is the uploader but not a project member with notify_on_comment
        $comment = Comment::factory()->create([
            'asset_id' => $this->asset->id,
            'user_id' => $this->pm->id,
        ]);

        $this->dispatcher->notifyCommentCreated($comment, $this->pm);

        Notification::assertSentTo($this->creative, NewCommentNotification::class);
    }

    // notifyCommentReply

    public function test_comment_reply_sends_to_parent_author(): void
    {
        $parentComment = Comment::factory()->create([
            'asset_id' => $this->asset->id,
            'user_id' => $this->creative->id,
        ]);
        $reply = Comment::factory()->create([
            'asset_id' => $this->asset->id,
            'user_id' => $this->pm->id,
            'parent_id' => $parentComment->id,
        ]);

        $this->dispatcher->notifyCommentReply($reply, $this->pm);

        Notification::assertSentTo($this->creative, CommentReplyNotification::class);
    }

    public function test_comment_reply_skips_self_reply(): void
    {
        $parentComment = Comment::factory()->create([
            'asset_id' => $this->asset->id,
            'user_id' => $this->creative->id,
        ]);
        $reply = Comment::factory()->create([
            'asset_id' => $this->asset->id,
            'user_id' => $this->creative->id,
            'parent_id' => $parentComment->id,
        ]);

        $this->dispatcher->notifyCommentReply($reply, $this->creative);

        Notification::assertNotSentTo($this->creative, CommentReplyNotification::class);
    }

    // notifyMentionedUsers

    public function test_mention_excludes_actor(): void
    {
        $comment = Comment::factory()->create([
            'asset_id' => $this->asset->id,
            'user_id' => $this->pm->id,
        ]);
        $mentionedUsers = collect([$this->pm, $this->creative]);

        $this->dispatcher->notifyMentionedUsers($comment, $mentionedUsers, $this->pm);

        Notification::assertNotSentTo($this->pm, MentionNotification::class);
    }

    public function test_mention_excludes_parent_author_on_reply(): void
    {
        $parentComment = Comment::factory()->create([
            'asset_id' => $this->asset->id,
            'user_id' => $this->creative->id,
        ]);
        $reply = Comment::factory()->create([
            'asset_id' => $this->asset->id,
            'user_id' => $this->pm->id,
            'parent_id' => $parentComment->id,
        ]);

        $otherUser = User::factory()->pm()->create();
        $mentionedUsers = collect([$this->creative, $otherUser]);

        $this->dispatcher->notifyMentionedUsers($reply, $mentionedUsers, $this->pm);

        // creative is parent author, gets CommentReplyNotification instead
        Notification::assertNotSentTo($this->creative, MentionNotification::class);
        Notification::assertSentTo($otherUser, MentionNotification::class);
    }

    public function test_mention_excludes_existing_comment_notification_recipients(): void
    {
        // creative is a member with notify_on_comment, so they get NewCommentNotification
        $this->addMember($this->creative, ['notify_on_comment' => true]);
        $comment = Comment::factory()->create([
            'asset_id' => $this->asset->id,
            'user_id' => $this->pm->id,
        ]);

        $otherUser = User::factory()->pm()->create();
        $mentionedUsers = collect([$this->creative, $otherUser]);

        $this->dispatcher->notifyMentionedUsers($comment, $mentionedUsers, $this->pm);

        // creative already gets NewCommentNotification, should not get MentionNotification
        Notification::assertNotSentTo($this->creative, MentionNotification::class);
        Notification::assertSentTo($otherUser, MentionNotification::class);
    }

    // notifyRequestAssigned

    public function test_request_assigned_sends_to_assignee(): void
    {
        $request = CreativeRequest::factory()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->dispatcher->notifyRequestAssigned($request, $this->creative, $this->pm);

        Notification::assertSentTo($this->creative, RequestAssignedNotification::class);
    }

    public function test_request_assigned_skips_self_assignment(): void
    {
        $request = CreativeRequest::factory()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->creative->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->dispatcher->notifyRequestAssigned($request, $this->creative, $this->creative);

        Notification::assertNotSentTo($this->creative, RequestAssignedNotification::class);
    }

    // notifyRequestStatusChanged

    public function test_request_status_changed_sends_to_assignee_and_creator(): void
    {
        $request = CreativeRequest::factory()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->dispatcher->notifyRequestStatusChanged($request, 'pending', $this->admin);

        Notification::assertSentTo($this->pm, RequestStatusChangedNotification::class);
        Notification::assertSentTo($this->creative, RequestStatusChangedNotification::class);
    }

    public function test_request_status_changed_excludes_actor_as_assignee(): void
    {
        $request = CreativeRequest::factory()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->dispatcher->notifyRequestStatusChanged($request, 'pending', $this->creative);

        Notification::assertNotSentTo($this->creative, RequestStatusChangedNotification::class);
        Notification::assertSentTo($this->pm, RequestStatusChangedNotification::class);
    }

    public function test_request_status_changed_excludes_actor_as_creator(): void
    {
        $request = CreativeRequest::factory()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->dispatcher->notifyRequestStatusChanged($request, 'pending', $this->pm);

        Notification::assertNotSentTo($this->pm, RequestStatusChangedNotification::class);
        Notification::assertSentTo($this->creative, RequestStatusChangedNotification::class);
    }
}
