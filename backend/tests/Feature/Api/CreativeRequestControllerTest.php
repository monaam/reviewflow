<?php

namespace Tests\Feature\Api;

use App\Models\CreativeRequest;
use App\Models\RequestAttachment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Tests\Traits\ApiTestHelpers;

class CreativeRequestControllerTest extends TestCase
{
    use RefreshDatabase, ApiTestHelpers;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpUsers();
        Storage::fake('local');
    }

    // INDEX TESTS

    public function test_admin_can_list_project_requests(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        CreativeRequest::factory()->count(3)->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->actingAsAdmin();
        $response = $this->getJson("/api/projects/{$project->id}/requests");

        $response->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_pm_can_list_requests_they_created(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        CreativeRequest::factory()->count(2)->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        // Request created by another PM
        $otherPm = User::factory()->pm()->create();
        CreativeRequest::factory()->create([
            'project_id' => $project->id,
            'created_by' => $otherPm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->actingAsPM();
        $response = $this->getJson("/api/projects/{$project->id}/requests");

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_creative_can_list_requests_assigned_to_them(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        CreativeRequest::factory()->count(2)->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        // Request assigned to another creative
        $otherCreative = User::factory()->creative()->create();
        CreativeRequest::factory()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $otherCreative->id,
        ]);

        $this->actingAsCreative();
        $response = $this->getJson("/api/projects/{$project->id}/requests");

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_requests_can_be_filtered_by_status(): void
    {
        $project = $this->createProjectWithMembers($this->admin);
        CreativeRequest::factory()->pending()->count(2)->create([
            'project_id' => $project->id,
            'created_by' => $this->admin->id,
        ]);
        CreativeRequest::factory()->inProgress()->create([
            'project_id' => $project->id,
            'created_by' => $this->admin->id,
        ]);

        $this->actingAsAdmin();
        $response = $this->getJson("/api/projects/{$project->id}/requests?status=pending");

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_requests_can_be_filtered_by_priority(): void
    {
        $project = $this->createProjectWithMembers($this->admin);
        CreativeRequest::factory()->urgent()->count(2)->create([
            'project_id' => $project->id,
            'created_by' => $this->admin->id,
        ]);
        CreativeRequest::factory()->lowPriority()->create([
            'project_id' => $project->id,
            'created_by' => $this->admin->id,
        ]);

        $this->actingAsAdmin();
        $response = $this->getJson("/api/projects/{$project->id}/requests?priority=urgent");

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    // MY QUEUE TESTS

    public function test_creative_can_view_their_queue(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        CreativeRequest::factory()->pending()->count(2)->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);
        CreativeRequest::factory()->inProgress()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);
        // Completed request should not appear
        CreativeRequest::factory()->completed()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->actingAsCreative();
        $response = $this->getJson('/api/requests/my-queue');

        $response->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_my_queue_includes_unassigned_requests(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        // Assigned to this creative
        CreativeRequest::factory()->pending()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);
        // Unassigned - should also appear
        CreativeRequest::factory()->pending()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => null,
        ]);
        // Assigned to another creative - should NOT appear
        $otherCreative = User::factory()->creative()->create();
        CreativeRequest::factory()->pending()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $otherCreative->id,
        ]);

        $this->actingAsCreative();
        $response = $this->getJson('/api/requests/my-queue');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_my_queue_can_be_filtered_by_status(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        CreativeRequest::factory()->pending()->count(2)->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);
        CreativeRequest::factory()->inProgress()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->actingAsCreative();
        $response = $this->getJson('/api/requests/my-queue?status=pending');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    // STORE TESTS

    public function test_pm_can_create_request(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);

        $this->actingAsPM();
        $response = $this->postJson("/api/projects/{$project->id}/requests", [
            'title' => 'New Creative Request',
            'description' => 'Please create a banner',
            'assigned_to' => $this->creative->id,
            'deadline' => now()->addWeek()->toIso8601String(),
            'priority' => 'high',
            'specs' => [
                'format' => 'png',
                'dimensions' => '1200x628',
            ],
        ]);

        $response->assertCreated()
            ->assertJsonPath('title', 'New Creative Request')
            ->assertJsonPath('priority', 'high')
            ->assertJsonPath('status', 'pending')
            ->assertJsonPath('created_by', $this->pm->id);
    }

    public function test_admin_can_create_request(): void
    {
        $project = $this->createProjectWithMembers($this->admin, [$this->creative]);

        $this->actingAsAdmin();
        $response = $this->postJson("/api/projects/{$project->id}/requests", [
            'title' => 'Admin Request',
            'description' => 'Admin created request',
            'assigned_to' => $this->creative->id,
            'deadline' => now()->addWeek()->toIso8601String(),
        ]);

        $response->assertCreated();
    }

    public function test_creative_cannot_create_request(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);

        $this->actingAsCreative();
        $response = $this->postJson("/api/projects/{$project->id}/requests", [
            'title' => 'Unauthorized Request',
            'description' => 'Should fail',
            'assigned_to' => $this->creative->id,
            'deadline' => now()->addWeek()->toIso8601String(),
        ]);

        $response->assertForbidden();
    }

    public function test_request_requires_title(): void
    {
        $project = $this->createProjectWithMembers($this->pm);

        $this->actingAsPM();
        $response = $this->postJson("/api/projects/{$project->id}/requests", [
            'description' => 'No title',
            'assigned_to' => $this->creative->id,
            'deadline' => now()->addWeek()->toIso8601String(),
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['title']);
    }

    public function test_request_can_be_created_without_assigned_to(): void
    {
        $project = $this->createProjectWithMembers($this->pm);

        $this->actingAsPM();
        $response = $this->postJson("/api/projects/{$project->id}/requests", [
            'title' => 'Test',
            'description' => 'Test',
            'deadline' => now()->addWeek()->toIso8601String(),
        ]);

        $response->assertCreated()
            ->assertJsonPath('assigned_to', null);
    }

    public function test_request_deadline_must_be_in_future(): void
    {
        $project = $this->createProjectWithMembers($this->pm);

        $this->actingAsPM();
        $response = $this->postJson("/api/projects/{$project->id}/requests", [
            'title' => 'Test',
            'description' => 'Test',
            'assigned_to' => $this->creative->id,
            'deadline' => now()->subDay()->toIso8601String(),
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['deadline']);
    }

    // SHOW TESTS

    public function test_creator_can_view_request(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $request = CreativeRequest::factory()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->actingAsPM();
        $response = $this->getJson("/api/requests/{$request->id}");

        $response->assertOk()
            ->assertJsonStructure([
                'id', 'title', 'description', 'status', 'priority',
                'creator', 'assignee', 'project', 'attachments',
            ]);
    }

    public function test_assignee_can_view_request(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $request = CreativeRequest::factory()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->actingAsCreative();
        $response = $this->getJson("/api/requests/{$request->id}");

        $response->assertOk();
    }

    public function test_project_member_can_view_request(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative, $this->reviewer]);
        $request = CreativeRequest::factory()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->actingAsReviewer();
        $response = $this->getJson("/api/requests/{$request->id}");

        $response->assertOk();
    }

    public function test_non_related_user_cannot_view_request(): void
    {
        $project = $this->createProjectWithMembers($this->pm);
        $request = CreativeRequest::factory()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $otherUser = User::factory()->creative()->create();
        $this->actingAsUser($otherUser);
        $response = $this->getJson("/api/requests/{$request->id}");

        $response->assertForbidden();
    }

    // UPDATE TESTS

    public function test_creator_can_update_request(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $request = CreativeRequest::factory()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->actingAsPM();
        $response = $this->patchJson("/api/requests/{$request->id}", [
            'title' => 'Updated Title',
            'priority' => 'urgent',
        ]);

        $response->assertOk()
            ->assertJsonPath('title', 'Updated Title')
            ->assertJsonPath('priority', 'urgent');
    }

    public function test_admin_can_update_any_request(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $request = CreativeRequest::factory()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->actingAsAdmin();
        $response = $this->patchJson("/api/requests/{$request->id}", [
            'status' => 'in_progress',
        ]);

        $response->assertOk()
            ->assertJsonPath('status', 'in_progress');
    }

    public function test_cannot_set_status_to_cancelled(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $request = CreativeRequest::factory()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->actingAsAdmin();
        $response = $this->patchJson("/api/requests/{$request->id}", [
            'status' => 'cancelled',
        ]);

        // 'cancelled' is not a valid status - use delete instead
        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);
    }

    public function test_assignee_cannot_update_request(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $request = CreativeRequest::factory()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->actingAsCreative();
        $response = $this->patchJson("/api/requests/{$request->id}", [
            'title' => 'Should not work',
        ]);

        $response->assertForbidden();
    }

    // DELETE TESTS

    public function test_creator_can_delete_request(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $request = CreativeRequest::factory()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->actingAsPM();
        $response = $this->deleteJson("/api/requests/{$request->id}");

        $response->assertOk()
            ->assertJson(['message' => 'Request deleted successfully']);

        $this->assertDatabaseMissing('creative_requests', ['id' => $request->id]);
    }

    public function test_admin_can_delete_any_request(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $request = CreativeRequest::factory()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->actingAsAdmin();
        $response = $this->deleteJson("/api/requests/{$request->id}");

        $response->assertOk();
    }

    public function test_assignee_cannot_delete_request(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $request = CreativeRequest::factory()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->actingAsCreative();
        $response = $this->deleteJson("/api/requests/{$request->id}");

        $response->assertForbidden();
    }

    // START TESTS

    public function test_assignee_can_start_pending_request(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $request = CreativeRequest::factory()->pending()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->actingAsCreative();
        $response = $this->postJson("/api/requests/{$request->id}/start");

        $response->assertOk()
            ->assertJsonPath('status', 'in_progress');
    }

    public function test_non_assignee_cannot_start_request(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $request = CreativeRequest::factory()->pending()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->actingAsPM();
        $response = $this->postJson("/api/requests/{$request->id}/start");

        $response->assertForbidden();
    }

    public function test_cannot_start_non_pending_request(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $request = CreativeRequest::factory()->inProgress()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->actingAsCreative();
        $response = $this->postJson("/api/requests/{$request->id}/start");

        $response->assertForbidden();
    }

    public function test_creative_can_view_unassigned_request(): void
    {
        $project = $this->createProjectWithMembers($this->pm);
        $request = CreativeRequest::factory()->pending()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => null,
        ]);

        $this->actingAsCreative();
        $response = $this->getJson("/api/requests/{$request->id}");

        $response->assertOk()
            ->assertJsonPath('id', $request->id);
    }

    public function test_creative_can_start_unassigned_request_and_gets_assigned(): void
    {
        $project = $this->createProjectWithMembers($this->pm);
        $request = CreativeRequest::factory()->pending()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => null,
        ]);

        $this->actingAsCreative();
        $response = $this->postJson("/api/requests/{$request->id}/start");

        $response->assertOk()
            ->assertJsonPath('status', 'in_progress')
            ->assertJsonPath('assigned_to', $this->creative->id);

        // Verify assigned to request
        $this->assertDatabaseHas('creative_requests', [
            'id' => $request->id,
            'assigned_to' => $this->creative->id,
        ]);

        // Verify added as project member
        $this->assertDatabaseHas('project_members', [
            'project_id' => $project->id,
            'user_id' => $this->creative->id,
        ]);
    }

    // COMPLETE TESTS

    public function test_creator_can_complete_request(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $request = CreativeRequest::factory()->inProgress()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->actingAsPM();
        $response = $this->postJson("/api/requests/{$request->id}/complete");

        $response->assertOk()
            ->assertJsonPath('status', 'completed');
    }

    public function test_admin_can_complete_any_request(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $request = CreativeRequest::factory()->inProgress()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->actingAsAdmin();
        $response = $this->postJson("/api/requests/{$request->id}/complete");

        $response->assertOk()
            ->assertJsonPath('status', 'completed');
    }

    public function test_assignee_cannot_complete_request(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $request = CreativeRequest::factory()->inProgress()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->actingAsCreative();
        $response = $this->postJson("/api/requests/{$request->id}/complete");

        $response->assertForbidden();
    }

    // ATTACHMENT TESTS

    public function test_creator_can_add_attachment(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $request = CreativeRequest::factory()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->actingAsPM();
        $response = $this->postJson("/api/requests/{$request->id}/attachments", [
            'file' => UploadedFile::fake()->create('reference.pdf', 1024, 'application/pdf'),
        ]);

        $response->assertCreated()
            ->assertJsonStructure(['id', 'file_url', 'file_name', 'uploader']);
    }

    public function test_admin_can_add_attachment(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $request = CreativeRequest::factory()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->actingAsAdmin();
        $response = $this->postJson("/api/requests/{$request->id}/attachments", [
            'file' => UploadedFile::fake()->create('reference.pdf', 1024, 'application/pdf'),
        ]);

        $response->assertCreated();
    }

    public function test_assignee_cannot_add_attachment(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $request = CreativeRequest::factory()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->actingAsCreative();
        $response = $this->postJson("/api/requests/{$request->id}/attachments", [
            'file' => UploadedFile::fake()->create('reference.pdf', 1024, 'application/pdf'),
        ]);

        $response->assertForbidden();
    }

    public function test_creator_can_remove_attachment(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $request = CreativeRequest::factory()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);
        $attachment = RequestAttachment::factory()->create([
            'request_id' => $request->id,
            'uploaded_by' => $this->pm->id,
        ]);

        $this->actingAsPM();
        $response = $this->deleteJson("/api/requests/{$request->id}/attachments/{$attachment->id}");

        $response->assertOk()
            ->assertJson(['message' => 'Attachment removed successfully']);

        $this->assertDatabaseMissing('request_attachments', ['id' => $attachment->id]);
    }
}
