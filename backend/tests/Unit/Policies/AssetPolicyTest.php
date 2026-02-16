<?php

namespace Tests\Unit\Policies;

use App\Models\Asset;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use App\Policies\AssetPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AssetPolicyTest extends TestCase
{
    use RefreshDatabase;

    private AssetPolicy $policy;
    private User $admin;
    private User $pm;
    private User $creative;
    private User $reviewer;
    private Project $project;
    private Asset $asset;

    protected function setUp(): void
    {
        parent::setUp();

        $this->policy = new AssetPolicy();
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

    // VIEW TESTS

    public function test_admin_can_view_any_asset(): void
    {
        $this->assertTrue($this->policy->view($this->admin, $this->asset));
    }

    public function test_member_can_view_asset(): void
    {
        $this->addMember($this->creative);
        $this->assertTrue($this->policy->view($this->creative, $this->asset));
    }

    public function test_non_member_cannot_view_asset(): void
    {
        $this->assertFalse($this->policy->view($this->creative, $this->asset));
    }

    public function test_reviewer_can_view_client_review_asset(): void
    {
        $this->addMember($this->reviewer);
        $this->asset->update(['status' => 'client_review']);
        $this->assertTrue($this->policy->view($this->reviewer, $this->asset->fresh()));
    }

    public function test_reviewer_can_view_approved_asset(): void
    {
        $this->addMember($this->reviewer);
        $this->asset->update(['status' => 'approved']);
        $this->assertTrue($this->policy->view($this->reviewer, $this->asset->fresh()));
    }

    public function test_reviewer_can_view_revision_requested_asset(): void
    {
        $this->addMember($this->reviewer);
        $this->asset->update(['status' => 'revision_requested']);
        $this->assertTrue($this->policy->view($this->reviewer, $this->asset->fresh()));
    }

    public function test_reviewer_can_view_published_asset(): void
    {
        $this->addMember($this->reviewer);
        $this->asset->update(['status' => 'published']);
        $this->assertTrue($this->policy->view($this->reviewer, $this->asset->fresh()));
    }

    public function test_reviewer_cannot_view_pending_review_asset(): void
    {
        $this->addMember($this->reviewer);
        $this->asset->update(['status' => 'pending_review']);
        $this->assertFalse($this->policy->view($this->reviewer, $this->asset->fresh()));
    }

    public function test_reviewer_cannot_view_in_review_asset(): void
    {
        $this->addMember($this->reviewer);
        $this->asset->update(['status' => 'in_review']);
        $this->assertFalse($this->policy->view($this->reviewer, $this->asset->fresh()));
    }

    // UPDATE TESTS

    public function test_admin_can_update_any_asset(): void
    {
        $this->assertTrue($this->policy->update($this->admin, $this->asset));
    }

    public function test_pm_member_can_update_asset(): void
    {
        $this->assertTrue($this->policy->update($this->pm, $this->asset));
    }

    public function test_creative_can_update_own_asset(): void
    {
        $this->assertTrue($this->policy->update($this->creative, $this->asset));
    }

    public function test_creative_cannot_update_others_asset(): void
    {
        $otherCreative = User::factory()->creative()->create();
        $this->assertFalse($this->policy->update($otherCreative, $this->asset));
    }

    public function test_reviewer_cannot_update_asset(): void
    {
        $this->addMember($this->reviewer);
        $this->assertFalse($this->policy->update($this->reviewer, $this->asset));
    }

    // DELETE TESTS

    public function test_admin_can_delete_asset(): void
    {
        $this->assertTrue($this->policy->delete($this->admin, $this->asset));
    }

    public function test_pm_owner_can_delete_asset(): void
    {
        $this->assertTrue($this->policy->delete($this->pm, $this->asset));
    }

    public function test_pm_non_owner_cannot_delete_asset(): void
    {
        $otherPm = User::factory()->pm()->create();
        ProjectMember::factory()->create([
            'project_id' => $this->project->id,
            'user_id' => $otherPm->id,
        ]);
        $this->assertFalse($this->policy->delete($otherPm, $this->asset));
    }

    public function test_creative_cannot_delete_asset(): void
    {
        $this->assertFalse($this->policy->delete($this->creative, $this->asset));
    }

    public function test_reviewer_cannot_delete_asset(): void
    {
        $this->assertFalse($this->policy->delete($this->reviewer, $this->asset));
    }

    // APPROVE TESTS

    public function test_admin_can_approve_asset(): void
    {
        $this->assertTrue($this->policy->approve($this->admin, $this->asset));
    }

    public function test_pm_member_can_approve_asset(): void
    {
        $this->assertTrue($this->policy->approve($this->pm, $this->asset));
    }

    public function test_reviewer_member_can_approve_asset(): void
    {
        $this->addMember($this->reviewer);
        $this->assertTrue($this->policy->approve($this->reviewer, $this->asset));
    }

    public function test_creative_cannot_approve_asset(): void
    {
        $this->addMember($this->creative);
        $this->assertFalse($this->policy->approve($this->creative, $this->asset));
    }

    // LOCK TESTS

    public function test_admin_can_lock_asset(): void
    {
        $this->assertTrue($this->policy->lock($this->admin, $this->asset));
    }

    public function test_pm_member_can_lock_asset(): void
    {
        $this->assertTrue($this->policy->lock($this->pm, $this->asset));
    }

    public function test_creative_cannot_lock_asset(): void
    {
        $this->addMember($this->creative);
        $this->assertFalse($this->policy->lock($this->creative, $this->asset));
    }

    public function test_reviewer_cannot_lock_asset(): void
    {
        $this->addMember($this->reviewer);
        $this->assertFalse($this->policy->lock($this->reviewer, $this->asset));
    }

    // PUBLISH TESTS

    public function test_admin_can_publish_asset(): void
    {
        $this->assertTrue($this->policy->publish($this->admin, $this->asset));
    }

    public function test_pm_member_can_publish_asset(): void
    {
        $this->assertTrue($this->policy->publish($this->pm, $this->asset));
    }

    public function test_creative_cannot_publish_asset(): void
    {
        $this->addMember($this->creative);
        $this->assertFalse($this->policy->publish($this->creative, $this->asset));
    }

    public function test_reviewer_cannot_publish_asset(): void
    {
        $this->addMember($this->reviewer);
        $this->assertFalse($this->policy->publish($this->reviewer, $this->asset));
    }
}
