<?php

namespace Tests\Feature\Api;

use App\Models\Asset;
use App\Models\Comment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\ApiTestHelpers;

class CommentControllerTest extends TestCase
{
    use RefreshDatabase, ApiTestHelpers;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpUsers();
    }

    // INDEX TESTS

    public function test_pm_can_list_all_asset_comments(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative, $this->reviewer]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        Comment::factory()->count(3)->create([
            'asset_id' => $asset->id,
            'asset_version' => 1,
        ]);

        $this->actingAsPM();
        $response = $this->getJson("/api/assets/{$asset->id}/comments");

        $response->assertOk()
            ->assertJsonCount(3);
    }

    public function test_reviewer_only_sees_own_comments(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative, $this->reviewer]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $asset->update(['status' => 'client_review']);

        // PM's comment - reviewer should NOT see this
        Comment::factory()->create([
            'asset_id' => $asset->id,
            'asset_version' => 1,
            'user_id' => $this->pm->id,
        ]);
        // Reviewer's own comments - reviewer SHOULD see these
        Comment::factory()->count(2)->create([
            'asset_id' => $asset->id,
            'asset_version' => 1,
            'user_id' => $this->reviewer->id,
        ]);

        $this->actingAsReviewer();
        $response = $this->getJson("/api/assets/{$asset->id}/comments");

        $response->assertOk()
            ->assertJsonCount(2); // Only reviewer's own comments
    }

    public function test_comments_default_to_current_version(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $asset->update(['current_version' => 2]);

        Comment::factory()->count(2)->create([
            'asset_id' => $asset->id,
            'asset_version' => 1,
        ]);
        Comment::factory()->count(3)->create([
            'asset_id' => $asset->id,
            'asset_version' => 2,
        ]);

        $this->actingAsPM();
        $response = $this->getJson("/api/assets/{$asset->id}/comments");

        $response->assertOk()
            ->assertJsonCount(3);
    }

    public function test_can_filter_comments_by_version(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        Comment::factory()->count(2)->create([
            'asset_id' => $asset->id,
            'asset_version' => 1,
        ]);
        Comment::factory()->count(3)->create([
            'asset_id' => $asset->id,
            'asset_version' => 2,
        ]);

        $this->actingAsPM();
        $response = $this->getJson("/api/assets/{$asset->id}/comments?version=1");

        $response->assertOk()
            ->assertJsonCount(2);
    }

    public function test_can_filter_comments_by_resolved_status(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        Comment::factory()->count(2)->create([
            'asset_id' => $asset->id,
            'asset_version' => 1,
            'is_resolved' => false,
        ]);
        Comment::factory()->resolved()->create([
            'asset_id' => $asset->id,
            'asset_version' => 1,
        ]);

        $this->actingAsPM();
        $response = $this->getJson("/api/assets/{$asset->id}/comments?resolved=false");

        $response->assertOk()
            ->assertJsonCount(2);
    }

    public function test_non_member_cannot_list_comments(): void
    {
        $project = $this->createProjectWithMembers($this->pm);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        $this->actingAsCreative();
        $response = $this->getJson("/api/assets/{$asset->id}/comments");

        $response->assertForbidden();
    }

    // STORE TESTS

    public function test_member_can_add_comment(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->reviewer]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $asset->update(['status' => 'client_review']); // Reviewers can only see client-facing assets

        $this->actingAsReviewer();
        $response = $this->postJson("/api/assets/{$asset->id}/comments", [
            'content' => 'This is a comment',
        ]);

        $response->assertCreated()
            ->assertJsonPath('content', 'This is a comment')
            ->assertJsonPath('user_id', $this->reviewer->id)
            ->assertJsonPath('asset_version', 1);

        // is_resolved defaults to false (or null if not set)
        $this->assertFalse($response->json('is_resolved') ?? false);
    }

    public function test_can_add_comment_with_annotation(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->reviewer]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $asset->update(['status' => 'client_review']); // Reviewers can only see client-facing assets

        $this->actingAsReviewer();
        $response = $this->postJson("/api/assets/{$asset->id}/comments", [
            'content' => 'Check this area',
            'rectangle' => [
                'x' => 0.25,
                'y' => 0.35,
                'width' => 0.15,
                'height' => 0.20,
            ],
        ]);

        $response->assertCreated()
            ->assertJsonPath('rectangle.x', 0.25)
            ->assertJsonPath('rectangle.y', 0.35);
    }

    public function test_can_add_comment_with_video_timestamp(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->reviewer]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $asset->update(['type' => 'video', 'status' => 'client_review']); // Reviewers can only see client-facing assets

        $this->actingAsReviewer();
        $response = $this->postJson("/api/assets/{$asset->id}/comments", [
            'content' => 'Issue at this timestamp',
            'video_timestamp' => 45.5,
        ]);

        $response->assertCreated()
            ->assertJsonPath('video_timestamp', 45.5);
    }

    public function test_comment_requires_content(): void
    {
        $project = $this->createProjectWithMembers($this->pm);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        $this->actingAsPM();
        $response = $this->postJson("/api/assets/{$asset->id}/comments", []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['content']);
    }

    public function test_comment_content_max_length(): void
    {
        $project = $this->createProjectWithMembers($this->pm);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        $this->actingAsPM();
        $response = $this->postJson("/api/assets/{$asset->id}/comments", [
            'content' => str_repeat('a', 5001),
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['content']);
    }

    public function test_rectangle_requires_all_coordinates(): void
    {
        $project = $this->createProjectWithMembers($this->pm);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        $this->actingAsPM();
        $response = $this->postJson("/api/assets/{$asset->id}/comments", [
            'content' => 'Test',
            'rectangle' => [
                'x' => 0.5,
                'y' => 0.5,
                // missing width and height
            ],
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['rectangle.width', 'rectangle.height']);
    }

    public function test_rectangle_values_must_be_between_0_and_1(): void
    {
        $project = $this->createProjectWithMembers($this->pm);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        $this->actingAsPM();
        $response = $this->postJson("/api/assets/{$asset->id}/comments", [
            'content' => 'Test',
            'rectangle' => [
                'x' => 1.5,
                'y' => 0.5,
                'width' => 0.2,
                'height' => 0.2,
            ],
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['rectangle.x']);
    }

    public function test_non_member_cannot_add_comment(): void
    {
        $project = $this->createProjectWithMembers($this->pm);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        $this->actingAsCreative();
        $response = $this->postJson("/api/assets/{$asset->id}/comments", [
            'content' => 'Unauthorized comment',
        ]);

        $response->assertForbidden();
    }

    // UPDATE TESTS

    public function test_comment_author_can_update_comment(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->reviewer]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $comment = Comment::factory()->create([
            'asset_id' => $asset->id,
            'user_id' => $this->reviewer->id,
        ]);

        $this->actingAsReviewer();
        $response = $this->patchJson("/api/comments/{$comment->id}", [
            'content' => 'Updated comment content',
        ]);

        $response->assertOk()
            ->assertJsonPath('content', 'Updated comment content');
    }

    public function test_other_user_cannot_update_comment(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->reviewer]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $comment = Comment::factory()->create([
            'asset_id' => $asset->id,
            'user_id' => $this->reviewer->id,
        ]);

        $this->actingAsPM();
        $response = $this->patchJson("/api/comments/{$comment->id}", [
            'content' => 'Unauthorized update',
        ]);

        $response->assertForbidden();
    }

    public function test_admin_cannot_update_others_comment(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->reviewer]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $comment = Comment::factory()->create([
            'asset_id' => $asset->id,
            'user_id' => $this->reviewer->id,
        ]);

        $this->actingAsAdmin();
        $response = $this->patchJson("/api/comments/{$comment->id}", [
            'content' => 'Admin update',
        ]);

        $response->assertForbidden();
    }

    // DELETE TESTS

    public function test_comment_author_can_delete_comment(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->reviewer]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $comment = Comment::factory()->create([
            'asset_id' => $asset->id,
            'user_id' => $this->reviewer->id,
        ]);

        $this->actingAsReviewer();
        $response = $this->deleteJson("/api/comments/{$comment->id}");

        $response->assertOk()
            ->assertJson(['message' => 'Comment deleted successfully']);

        $this->assertDatabaseMissing('comments', ['id' => $comment->id]);
    }

    public function test_admin_can_delete_any_comment(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->reviewer]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $comment = Comment::factory()->create([
            'asset_id' => $asset->id,
            'user_id' => $this->reviewer->id,
        ]);

        $this->actingAsAdmin();
        $response = $this->deleteJson("/api/comments/{$comment->id}");

        $response->assertOk();
    }

    public function test_pm_can_delete_comment_in_their_project(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->reviewer]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $comment = Comment::factory()->create([
            'asset_id' => $asset->id,
            'user_id' => $this->reviewer->id,
        ]);

        $this->actingAsPM();
        $response = $this->deleteJson("/api/comments/{$comment->id}");

        $response->assertOk();
    }

    public function test_non_author_creative_cannot_delete_comment(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative, $this->reviewer]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $comment = Comment::factory()->create([
            'asset_id' => $asset->id,
            'user_id' => $this->reviewer->id,
        ]);

        $this->actingAsCreative();
        $response = $this->deleteJson("/api/comments/{$comment->id}");

        $response->assertForbidden();
    }

    // RESOLVE TESTS

    public function test_pm_can_resolve_comment(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->reviewer]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $comment = Comment::factory()->create([
            'asset_id' => $asset->id,
            'user_id' => $this->reviewer->id,
        ]);

        $this->actingAsPM();
        $response = $this->postJson("/api/comments/{$comment->id}/resolve");

        $response->assertOk()
            ->assertJsonPath('is_resolved', true)
            ->assertJsonPath('resolved_by', $this->pm->id);
    }

    public function test_admin_can_resolve_comment(): void
    {
        // Admin needs to be a project member to resolve comments
        $project = $this->createProjectWithMembers($this->pm, [$this->admin, $this->reviewer]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $comment = Comment::factory()->create([
            'asset_id' => $asset->id,
            'user_id' => $this->reviewer->id,
        ]);

        $this->actingAsAdmin();
        $response = $this->postJson("/api/comments/{$comment->id}/resolve");

        $response->assertOk()
            ->assertJsonPath('is_resolved', true);
    }

    public function test_creative_can_resolve_comment_on_own_asset(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative, $this->reviewer]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $comment = Comment::factory()->create([
            'asset_id' => $asset->id,
            'user_id' => $this->reviewer->id,
        ]);

        $this->actingAsCreative();
        $response = $this->postJson("/api/comments/{$comment->id}/resolve");

        $response->assertOk()
            ->assertJsonPath('is_resolved', true);
    }

    public function test_creative_cannot_resolve_comment_on_others_asset(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative, $this->reviewer]);
        $asset = $this->createAssetWithVersion($project, $this->pm);
        $comment = Comment::factory()->create([
            'asset_id' => $asset->id,
            'user_id' => $this->reviewer->id,
        ]);

        $this->actingAsCreative();
        $response = $this->postJson("/api/comments/{$comment->id}/resolve");

        $response->assertForbidden();
    }

    public function test_reviewer_can_resolve_comment_on_client_review_asset(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->reviewer]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $asset->update(['status' => 'client_review']); // Reviewers can resolve comments on client-facing assets
        $comment = Comment::factory()->create([
            'asset_id' => $asset->id,
            'user_id' => $this->pm->id,
        ]);

        $this->actingAsReviewer();
        $response = $this->postJson("/api/comments/{$comment->id}/resolve");

        $response->assertOk()
            ->assertJsonPath('is_resolved', true)
            ->assertJsonPath('resolved_by', $this->reviewer->id);
    }

    public function test_reviewer_can_unresolve_comment_on_client_review_asset(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->reviewer]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $asset->update(['status' => 'client_review']);
        $comment = Comment::factory()->resolved()->create([
            'asset_id' => $asset->id,
            'user_id' => $this->pm->id,
        ]);

        $this->actingAsReviewer();
        $response = $this->postJson("/api/comments/{$comment->id}/unresolve");

        $response->assertOk()
            ->assertJsonPath('is_resolved', false);
    }

    // UNRESOLVE TESTS

    public function test_pm_can_unresolve_comment(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->reviewer]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $comment = Comment::factory()->resolved()->create([
            'asset_id' => $asset->id,
            'user_id' => $this->reviewer->id,
        ]);

        $this->actingAsPM();
        $response = $this->postJson("/api/comments/{$comment->id}/unresolve");

        $response->assertOk()
            ->assertJsonPath('is_resolved', false)
            ->assertJsonPath('resolved_by', null);
    }

    public function test_creative_can_unresolve_comment_on_own_asset(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative, $this->reviewer]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $comment = Comment::factory()->resolved()->create([
            'asset_id' => $asset->id,
            'user_id' => $this->reviewer->id,
        ]);

        $this->actingAsCreative();
        $response = $this->postJson("/api/comments/{$comment->id}/unresolve");

        $response->assertOk()
            ->assertJsonPath('is_resolved', false);
    }
}
