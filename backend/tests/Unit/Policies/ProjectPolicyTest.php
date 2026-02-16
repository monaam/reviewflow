<?php

namespace Tests\Unit\Policies;

use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use App\Policies\ProjectPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectPolicyTest extends TestCase
{
    use RefreshDatabase;

    private ProjectPolicy $policy;
    private User $admin;
    private User $pm;
    private User $creative;
    private User $reviewer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->policy = new ProjectPolicy();
        $this->admin = User::factory()->admin()->create();
        $this->pm = User::factory()->pm()->create();
        $this->creative = User::factory()->creative()->create();
        $this->reviewer = User::factory()->reviewer()->create();
    }

    // VIEW ANY

    public function test_any_user_can_view_project_list(): void
    {
        $this->assertTrue($this->policy->viewAny($this->admin));
        $this->assertTrue($this->policy->viewAny($this->pm));
        $this->assertTrue($this->policy->viewAny($this->creative));
        $this->assertTrue($this->policy->viewAny($this->reviewer));
    }

    // VIEW

    public function test_admin_can_view_any_project(): void
    {
        $project = Project::factory()->create();
        $this->assertTrue($this->policy->view($this->admin, $project));
    }

    public function test_member_can_view_project(): void
    {
        $project = Project::factory()->create();
        ProjectMember::factory()->create([
            'project_id' => $project->id,
            'user_id' => $this->creative->id,
        ]);
        $this->assertTrue($this->policy->view($this->creative, $project));
    }

    public function test_non_member_cannot_view_project(): void
    {
        $project = Project::factory()->create();
        $this->assertFalse($this->policy->view($this->creative, $project));
    }

    // CREATE

    public function test_admin_can_create_project(): void
    {
        $this->assertTrue($this->policy->create($this->admin));
    }

    public function test_pm_can_create_project(): void
    {
        $this->assertTrue($this->policy->create($this->pm));
    }

    public function test_creative_cannot_create_project(): void
    {
        $this->assertFalse($this->policy->create($this->creative));
    }

    public function test_reviewer_cannot_create_project(): void
    {
        $this->assertFalse($this->policy->create($this->reviewer));
    }

    // UPDATE

    public function test_admin_can_update_any_project(): void
    {
        $project = Project::factory()->create();
        $this->assertTrue($this->policy->update($this->admin, $project));
    }

    public function test_creator_pm_can_update_project(): void
    {
        $project = Project::factory()->create(['created_by' => $this->pm->id]);
        $this->assertTrue($this->policy->update($this->pm, $project));
    }

    public function test_owner_pm_can_update_project(): void
    {
        $project = Project::factory()->create();
        ProjectMember::factory()->owner()->create([
            'project_id' => $project->id,
            'user_id' => $this->pm->id,
        ]);
        $this->assertTrue($this->policy->update($this->pm, $project));
    }

    public function test_non_owner_pm_cannot_update_project(): void
    {
        $project = Project::factory()->create();
        ProjectMember::factory()->member()->create([
            'project_id' => $project->id,
            'user_id' => $this->pm->id,
        ]);
        $this->assertFalse($this->policy->update($this->pm, $project));
    }

    public function test_creative_cannot_update_project(): void
    {
        $project = Project::factory()->create();
        ProjectMember::factory()->create([
            'project_id' => $project->id,
            'user_id' => $this->creative->id,
        ]);
        $this->assertFalse($this->policy->update($this->creative, $project));
    }

    public function test_reviewer_cannot_update_project(): void
    {
        $project = Project::factory()->create();
        ProjectMember::factory()->create([
            'project_id' => $project->id,
            'user_id' => $this->reviewer->id,
        ]);
        $this->assertFalse($this->policy->update($this->reviewer, $project));
    }

    // DELETE

    public function test_admin_can_delete_project(): void
    {
        $project = Project::factory()->create();
        $this->assertTrue($this->policy->delete($this->admin, $project));
    }

    public function test_pm_cannot_delete_project(): void
    {
        $project = Project::factory()->create(['created_by' => $this->pm->id]);
        $this->assertFalse($this->policy->delete($this->pm, $project));
    }

    public function test_creative_cannot_delete_project(): void
    {
        $project = Project::factory()->create();
        $this->assertFalse($this->policy->delete($this->creative, $project));
    }

    public function test_reviewer_cannot_delete_project(): void
    {
        $project = Project::factory()->create();
        $this->assertFalse($this->policy->delete($this->reviewer, $project));
    }

    // UPLOAD ASSET

    public function test_admin_can_upload_asset(): void
    {
        $project = Project::factory()->create();
        $this->assertTrue($this->policy->uploadAsset($this->admin, $project));
    }

    public function test_pm_member_can_upload_asset(): void
    {
        $project = Project::factory()->create();
        ProjectMember::factory()->create([
            'project_id' => $project->id,
            'user_id' => $this->pm->id,
        ]);
        $this->assertTrue($this->policy->uploadAsset($this->pm, $project));
    }

    public function test_creative_member_can_upload_asset(): void
    {
        $project = Project::factory()->create();
        ProjectMember::factory()->create([
            'project_id' => $project->id,
            'user_id' => $this->creative->id,
        ]);
        $this->assertTrue($this->policy->uploadAsset($this->creative, $project));
    }

    public function test_reviewer_cannot_upload_asset(): void
    {
        $project = Project::factory()->create();
        ProjectMember::factory()->create([
            'project_id' => $project->id,
            'user_id' => $this->reviewer->id,
        ]);
        $this->assertFalse($this->policy->uploadAsset($this->reviewer, $project));
    }

    // CREATE REQUEST

    public function test_admin_can_create_request(): void
    {
        $project = Project::factory()->create();
        $this->assertTrue($this->policy->createRequest($this->admin, $project));
    }

    public function test_pm_member_can_create_request(): void
    {
        $project = Project::factory()->create();
        ProjectMember::factory()->create([
            'project_id' => $project->id,
            'user_id' => $this->pm->id,
        ]);
        $this->assertTrue($this->policy->createRequest($this->pm, $project));
    }

    public function test_creative_cannot_create_request(): void
    {
        $project = Project::factory()->create();
        ProjectMember::factory()->create([
            'project_id' => $project->id,
            'user_id' => $this->creative->id,
        ]);
        $this->assertFalse($this->policy->createRequest($this->creative, $project));
    }

    public function test_reviewer_cannot_create_request(): void
    {
        $project = Project::factory()->create();
        ProjectMember::factory()->create([
            'project_id' => $project->id,
            'user_id' => $this->reviewer->id,
        ]);
        $this->assertFalse($this->policy->createRequest($this->reviewer, $project));
    }
}
