<?php

namespace Tests\Unit\Policies;

use App\Models\CreativeRequest;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use App\Policies\CreativeRequestPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreativeRequestPolicyTest extends TestCase
{
    use RefreshDatabase;

    private CreativeRequestPolicy $policy;
    private User $admin;
    private User $pm;
    private User $creative;
    private User $reviewer;
    private Project $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->policy = new CreativeRequestPolicy();
        $this->admin = User::factory()->admin()->create();
        $this->pm = User::factory()->pm()->create();
        $this->creative = User::factory()->creative()->create();
        $this->reviewer = User::factory()->reviewer()->create();

        $this->project = Project::factory()->create(['created_by' => $this->pm->id]);
        ProjectMember::factory()->owner()->create([
            'project_id' => $this->project->id,
            'user_id' => $this->pm->id,
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

    public function test_reviewer_cannot_view_request(): void
    {
        $request = CreativeRequest::factory()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);
        $this->assertFalse($this->policy->view($this->reviewer, $request));
    }

    public function test_admin_can_view_any_request(): void
    {
        $request = CreativeRequest::factory()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);
        $this->assertTrue($this->policy->view($this->admin, $request));
    }

    public function test_creator_can_view_request(): void
    {
        $request = CreativeRequest::factory()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);
        $this->assertTrue($this->policy->view($this->pm, $request));
    }

    public function test_assignee_can_view_request(): void
    {
        $request = CreativeRequest::factory()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);
        $this->assertTrue($this->policy->view($this->creative, $request));
    }

    public function test_member_can_view_request(): void
    {
        $otherCreative = User::factory()->creative()->create();
        $this->addMember($otherCreative);
        $request = CreativeRequest::factory()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);
        $this->assertTrue($this->policy->view($otherCreative, $request));
    }

    public function test_creative_can_view_unassigned_request(): void
    {
        $request = CreativeRequest::factory()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => null,
        ]);
        $this->assertTrue($this->policy->view($this->creative, $request));
    }

    public function test_non_member_non_assignee_cannot_view_request(): void
    {
        $otherCreative = User::factory()->creative()->create();
        $request = CreativeRequest::factory()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);
        $this->assertFalse($this->policy->view($otherCreative, $request));
    }

    // UPDATE TESTS

    public function test_admin_can_update_request(): void
    {
        $request = CreativeRequest::factory()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->pm->id,
        ]);
        $this->assertTrue($this->policy->update($this->admin, $request));
    }

    public function test_creator_can_update_request(): void
    {
        $request = CreativeRequest::factory()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->pm->id,
        ]);
        $this->assertTrue($this->policy->update($this->pm, $request));
    }

    public function test_assignee_cannot_update_request(): void
    {
        $request = CreativeRequest::factory()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);
        $this->assertFalse($this->policy->update($this->creative, $request));
    }

    // DELETE TESTS

    public function test_admin_can_delete_request(): void
    {
        $request = CreativeRequest::factory()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->pm->id,
        ]);
        $this->assertTrue($this->policy->delete($this->admin, $request));
    }

    public function test_creator_can_delete_request(): void
    {
        $request = CreativeRequest::factory()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->pm->id,
        ]);
        $this->assertTrue($this->policy->delete($this->pm, $request));
    }

    public function test_assignee_cannot_delete_request(): void
    {
        $request = CreativeRequest::factory()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);
        $this->assertFalse($this->policy->delete($this->creative, $request));
    }

    // START TESTS

    public function test_assignee_can_start_pending_request(): void
    {
        $request = CreativeRequest::factory()->pending()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);
        $this->assertTrue($this->policy->start($this->creative, $request));
    }

    public function test_creative_can_start_unassigned_pending_request(): void
    {
        $request = CreativeRequest::factory()->pending()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => null,
        ]);
        $this->assertTrue($this->policy->start($this->creative, $request));
    }

    public function test_cannot_start_non_pending_request(): void
    {
        $request = CreativeRequest::factory()->inProgress()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);
        $this->assertFalse($this->policy->start($this->creative, $request));
    }

    public function test_pm_cannot_start_request(): void
    {
        $request = CreativeRequest::factory()->pending()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => null,
        ]);
        $this->assertFalse($this->policy->start($this->pm, $request));
    }

    // COMPLETE TESTS

    public function test_admin_can_complete_request(): void
    {
        $request = CreativeRequest::factory()->inProgress()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->pm->id,
        ]);
        $this->assertTrue($this->policy->complete($this->admin, $request));
    }

    public function test_creator_can_complete_request(): void
    {
        $request = CreativeRequest::factory()->inProgress()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->pm->id,
        ]);
        $this->assertTrue($this->policy->complete($this->pm, $request));
    }

    public function test_assignee_cannot_complete_request(): void
    {
        $request = CreativeRequest::factory()->inProgress()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);
        $this->assertFalse($this->policy->complete($this->creative, $request));
    }
}
