<?php

namespace Tests\Unit\Policies;

use App\Models\Asset;
use App\Models\Comment;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use App\Policies\CommentPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommentPolicyTest extends TestCase
{
    use RefreshDatabase;

    private CommentPolicy $policy;
    private User $admin;
    private User $pm;
    private User $creative;
    private User $reviewer;
    private Project $project;
    private Asset $asset;

    protected function setUp(): void
    {
        parent::setUp();

        $this->policy = new CommentPolicy();
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

    private function addMember(User $user): void
    {
        ProjectMember::factory()->create([
            'project_id' => $this->project->id,
            'user_id' => $user->id,
        ]);
    }

    // UPDATE TESTS

    public function test_author_can_update_own_comment(): void
    {
        $comment = Comment::factory()->create([
            'asset_id' => $this->asset->id,
            'user_id' => $this->creative->id,
        ]);
        $this->assertTrue($this->policy->update($this->creative, $comment));
    }

    public function test_non_author_cannot_update_comment(): void
    {
        $comment = Comment::factory()->create([
            'asset_id' => $this->asset->id,
            'user_id' => $this->creative->id,
        ]);
        $this->assertFalse($this->policy->update($this->pm, $comment));
    }

    public function test_admin_cannot_update_others_comment(): void
    {
        $comment = Comment::factory()->create([
            'asset_id' => $this->asset->id,
            'user_id' => $this->creative->id,
        ]);
        $this->assertFalse($this->policy->update($this->admin, $comment));
    }

    // DELETE TESTS

    public function test_admin_can_delete_any_comment(): void
    {
        $comment = Comment::factory()->create([
            'asset_id' => $this->asset->id,
            'user_id' => $this->creative->id,
        ]);
        $this->assertTrue($this->policy->delete($this->admin, $comment));
    }

    public function test_author_can_delete_own_comment(): void
    {
        $comment = Comment::factory()->create([
            'asset_id' => $this->asset->id,
            'user_id' => $this->creative->id,
        ]);
        $this->assertTrue($this->policy->delete($this->creative, $comment));
    }

    public function test_pm_member_can_delete_comment_in_project(): void
    {
        $comment = Comment::factory()->create([
            'asset_id' => $this->asset->id,
            'user_id' => $this->creative->id,
        ]);
        $this->assertTrue($this->policy->delete($this->pm, $comment));
    }

    public function test_pm_non_member_cannot_delete_comment(): void
    {
        $otherPm = User::factory()->pm()->create();
        $comment = Comment::factory()->create([
            'asset_id' => $this->asset->id,
            'user_id' => $this->creative->id,
        ]);
        $this->assertFalse($this->policy->delete($otherPm, $comment));
    }

    public function test_creative_cannot_delete_others_comment(): void
    {
        $this->addMember($this->creative);
        $otherCreative = User::factory()->creative()->create();
        $comment = Comment::factory()->create([
            'asset_id' => $this->asset->id,
            'user_id' => $otherCreative->id,
        ]);
        $this->assertFalse($this->policy->delete($this->creative, $comment));
    }

    public function test_reviewer_cannot_delete_others_comment(): void
    {
        $this->addMember($this->reviewer);
        $comment = Comment::factory()->create([
            'asset_id' => $this->asset->id,
            'user_id' => $this->creative->id,
        ]);
        $this->assertFalse($this->policy->delete($this->reviewer, $comment));
    }

    // RESOLVE TESTS

    public function test_admin_member_can_resolve_comment(): void
    {
        $this->addMember($this->admin);
        $comment = Comment::factory()->create([
            'asset_id' => $this->asset->id,
            'user_id' => $this->creative->id,
        ]);
        $this->assertTrue($this->policy->resolve($this->admin, $comment));
    }

    public function test_pm_member_can_resolve_comment(): void
    {
        $comment = Comment::factory()->create([
            'asset_id' => $this->asset->id,
            'user_id' => $this->creative->id,
        ]);
        $this->assertTrue($this->policy->resolve($this->pm, $comment));
    }

    public function test_reviewer_member_can_resolve_comment(): void
    {
        $this->addMember($this->reviewer);
        $comment = Comment::factory()->create([
            'asset_id' => $this->asset->id,
            'user_id' => $this->reviewer->id,
        ]);
        $this->assertTrue($this->policy->resolve($this->reviewer, $comment));
    }

    public function test_creative_can_resolve_comment_on_own_asset(): void
    {
        $comment = Comment::factory()->create([
            'asset_id' => $this->asset->id,
            'user_id' => $this->pm->id,
        ]);
        $this->assertTrue($this->policy->resolve($this->creative, $comment));
    }

    public function test_creative_cannot_resolve_comment_on_others_asset(): void
    {
        $otherAsset = Asset::factory()->create([
            'project_id' => $this->project->id,
            'uploaded_by' => $this->pm->id,
        ]);
        $comment = Comment::factory()->create([
            'asset_id' => $otherAsset->id,
            'user_id' => $this->pm->id,
        ]);
        $this->assertFalse($this->policy->resolve($this->creative, $comment));
    }

    // MANAGE MEDIA TESTS

    public function test_admin_can_manage_media_on_any_comment(): void
    {
        $comment = Comment::factory()->create([
            'asset_id' => $this->asset->id,
            'user_id' => $this->creative->id,
        ]);
        $this->assertTrue($this->policy->manageMedia($this->admin, $comment));
    }

    public function test_author_can_manage_media_on_own_comment(): void
    {
        $comment = Comment::factory()->create([
            'asset_id' => $this->asset->id,
            'user_id' => $this->creative->id,
        ]);
        $this->assertTrue($this->policy->manageMedia($this->creative, $comment));
    }
}
