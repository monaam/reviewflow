<?php

namespace Tests\Feature\Api;

use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;
use Tests\Traits\ApiTestHelpers;

class ProjectControllerTest extends TestCase
{
    use RefreshDatabase, ApiTestHelpers;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpUsers();
    }

    // INDEX TESTS

    public function test_admin_can_list_all_projects(): void
    {
        Project::factory()->count(5)->create();

        $this->actingAsAdmin();
        $response = $this->getJson('/api/projects');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'description', 'status', 'created_by', 'creator'],
                ],
                'current_page',
                'total',
            ]);

        $this->assertCount(5, $response->json('data'));
    }

    public function test_pm_can_only_see_their_projects(): void
    {
        // Create projects the PM is member of
        $project1 = $this->createProjectWithMembers($this->pm);
        $project2 = $this->createProjectWithMembers($this->pm);

        // Create a project the PM is not a member of
        $otherProject = Project::factory()->create();

        $this->actingAsPM();
        $response = $this->getJson('/api/projects');

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
    }

    public function test_projects_can_be_filtered_by_status(): void
    {
        $this->createProjectWithMembers($this->admin);
        Project::factory()->onHold()->create(['created_by' => $this->admin->id]);

        // Add admin as member to both
        ProjectMember::factory()->owner()->create([
            'project_id' => Project::where('status', 'on_hold')->first()->id,
            'user_id' => $this->admin->id,
        ]);

        $this->actingAsAdmin();
        $response = $this->getJson('/api/projects?status=active');

        $response->assertOk();
        foreach ($response->json('data') as $project) {
            $this->assertEquals('active', $project['status']);
        }
    }

    public function test_listing_projects_requires_authentication(): void
    {
        $response = $this->getJson('/api/projects');

        $response->assertUnauthorized();
    }

    // STORE TESTS

    public function test_admin_can_create_project(): void
    {
        $this->actingAsAdmin();
        $response = $this->postJson('/api/projects', [
            'name' => 'New Project',
            'description' => 'Project description',
            'client_name' => 'Acme Corp',
            'deadline' => now()->addMonth()->toIso8601String(),
        ]);

        $response->assertCreated()
            ->assertJsonPath('name', 'New Project')
            ->assertJsonPath('status', 'active');

        $this->assertDatabaseHas('projects', [
            'name' => 'New Project',
            'created_by' => $this->admin->id,
        ]);

        // Verify creator is added as owner member
        $this->assertDatabaseHas('project_members', [
            'project_id' => $response->json('id'),
            'user_id' => $this->admin->id,
            'role_in_project' => 'owner',
        ]);
    }

    public function test_pm_can_create_project(): void
    {
        $this->actingAsPM();
        $response = $this->postJson('/api/projects', [
            'name' => 'PM Project',
            'description' => 'Created by PM',
        ]);

        $response->assertCreated()
            ->assertJsonPath('created_by', $this->pm->id);
    }

    public function test_creative_cannot_create_project(): void
    {
        $this->actingAsCreative();
        $response = $this->postJson('/api/projects', [
            'name' => 'Unauthorized Project',
        ]);

        $response->assertForbidden();
    }

    public function test_reviewer_cannot_create_project(): void
    {
        $this->actingAsReviewer();
        $response = $this->postJson('/api/projects', [
            'name' => 'Unauthorized Project',
        ]);

        $response->assertForbidden();
    }

    public function test_project_creation_requires_name(): void
    {
        $this->actingAsAdmin();
        $response = $this->postJson('/api/projects', [
            'description' => 'No name provided',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    // SHOW TESTS

    public function test_admin_can_view_any_project(): void
    {
        $project = Project::factory()->create();

        $this->actingAsAdmin();
        $response = $this->getJson("/api/projects/{$project->id}");

        $response->assertOk()
            ->assertJsonPath('id', $project->id);
    }

    public function test_member_can_view_their_project(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);

        $this->actingAsCreative();
        $response = $this->getJson("/api/projects/{$project->id}");

        $response->assertOk()
            ->assertJsonPath('id', $project->id);
    }

    public function test_non_member_cannot_view_project(): void
    {
        $project = Project::factory()->create();

        $this->actingAsCreative();
        $response = $this->getJson("/api/projects/{$project->id}");

        $response->assertForbidden();
    }

    public function test_project_show_includes_relationships(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);

        $this->actingAsPM();
        $response = $this->getJson("/api/projects/{$project->id}");

        $response->assertOk()
            ->assertJsonStructure([
                'id',
                'name',
                'creator',
                'members',
                'assets',
                'creative_requests',
            ]);
    }

    // UPDATE TESTS

    public function test_admin_can_update_any_project(): void
    {
        $project = Project::factory()->create();

        $this->actingAsAdmin();
        $response = $this->patchJson("/api/projects/{$project->id}", [
            'name' => 'Updated Project Name',
            'status' => 'on_hold',
        ]);

        $response->assertOk()
            ->assertJsonPath('name', 'Updated Project Name')
            ->assertJsonPath('status', 'on_hold');
    }

    public function test_project_creator_can_update_project(): void
    {
        $project = $this->createProjectWithMembers($this->pm);

        $this->actingAsPM();
        $response = $this->patchJson("/api/projects/{$project->id}", [
            'name' => 'PM Updated Name',
        ]);

        $response->assertOk()
            ->assertJsonPath('name', 'PM Updated Name');
    }

    public function test_project_owner_member_can_update_project(): void
    {
        $project = Project::factory()->create(['created_by' => $this->admin->id]);
        ProjectMember::factory()->owner()->create([
            'project_id' => $project->id,
            'user_id' => $this->pm->id,
        ]);

        $this->actingAsPM();
        $response = $this->patchJson("/api/projects/{$project->id}", [
            'description' => 'Owner member update',
        ]);

        $response->assertOk();
    }

    public function test_creative_cannot_update_project(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);

        $this->actingAsCreative();
        $response = $this->patchJson("/api/projects/{$project->id}", [
            'name' => 'Creative Update Attempt',
        ]);

        $response->assertForbidden();
    }

    public function test_update_validates_status(): void
    {
        $project = $this->createProjectWithMembers($this->admin);

        $this->actingAsAdmin();
        $response = $this->patchJson("/api/projects/{$project->id}", [
            'status' => 'invalid_status',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);
    }

    // DELETE TESTS

    public function test_admin_can_delete_project(): void
    {
        $project = Project::factory()->create();

        $this->actingAsAdmin();
        $response = $this->deleteJson("/api/projects/{$project->id}");

        $response->assertOk()
            ->assertJson(['message' => 'Project deleted successfully']);

        $this->assertDatabaseMissing('projects', ['id' => $project->id]);
    }

    public function test_pm_cannot_delete_project(): void
    {
        $project = $this->createProjectWithMembers($this->pm);

        $this->actingAsPM();
        $response = $this->deleteJson("/api/projects/{$project->id}");

        $response->assertForbidden();
    }

    public function test_creative_cannot_delete_project(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);

        $this->actingAsCreative();
        $response = $this->deleteJson("/api/projects/{$project->id}");

        $response->assertForbidden();
    }

    // MEMBER MANAGEMENT TESTS

    public function test_admin_can_add_member_to_project(): void
    {
        $project = Project::factory()->create();
        $newMember = User::factory()->create();

        $this->actingAsAdmin();
        $response = $this->postJson("/api/projects/{$project->id}/members", [
            'user_id' => $newMember->id,
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.id', $newMember->id)
            ->assertJsonPath('role_in_project', 'member');
    }

    public function test_project_owner_can_add_member(): void
    {
        $project = $this->createProjectWithMembers($this->pm);
        $newMember = User::factory()->create();

        $this->actingAsPM();
        $response = $this->postJson("/api/projects/{$project->id}/members", [
            'user_id' => $newMember->id,
            'role_in_project' => 'owner',
        ]);

        $response->assertCreated()
            ->assertJsonPath('role_in_project', 'owner');
    }

    public function test_add_member_requires_valid_user_id(): void
    {
        $project = $this->createProjectWithMembers($this->admin);

        $this->actingAsAdmin();
        $response = $this->postJson("/api/projects/{$project->id}/members", [
            'user_id' => 'invalid-uuid',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['user_id']);
    }

    public function test_creative_cannot_add_members(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $newMember = User::factory()->create();

        $this->actingAsCreative();
        $response = $this->postJson("/api/projects/{$project->id}/members", [
            'user_id' => $newMember->id,
        ]);

        $response->assertForbidden();
    }

    public function test_admin_can_remove_member_from_project(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);

        $this->actingAsAdmin();
        $response = $this->deleteJson("/api/projects/{$project->id}/members/{$this->creative->id}");

        $response->assertOk()
            ->assertJson(['message' => 'Member removed successfully']);

        $this->assertDatabaseMissing('project_members', [
            'project_id' => $project->id,
            'user_id' => $this->creative->id,
        ]);
    }

    public function test_can_list_project_members(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative, $this->reviewer]);

        $this->actingAsPM();
        $response = $this->getJson("/api/projects/{$project->id}/members");

        $response->assertOk()
            ->assertJsonCount(3); // owner + 2 members
    }

    public function test_non_member_cannot_list_project_members(): void
    {
        $project = Project::factory()->create();

        $this->actingAsCreative();
        $response = $this->getJson("/api/projects/{$project->id}/members");

        $response->assertForbidden();
    }
}
