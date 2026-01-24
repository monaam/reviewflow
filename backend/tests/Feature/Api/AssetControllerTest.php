<?php

namespace Tests\Feature\Api;

use App\Models\ApprovalLog;
use App\Models\Asset;
use App\Models\AssetVersion;
use App\Models\CreativeRequest;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Tests\Traits\ApiTestHelpers;

class AssetControllerTest extends TestCase
{
    use RefreshDatabase, ApiTestHelpers;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpUsers();
        Storage::fake('local');
    }

    // INDEX TESTS

    public function test_admin_can_list_project_assets(): void
    {
        $project = Project::factory()->create();
        Asset::factory()->count(3)->create(['project_id' => $project->id]);

        $this->actingAsAdmin();
        $response = $this->getJson("/api/projects/{$project->id}/assets");

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'title', 'type', 'status', 'uploader'],
                ],
            ]);
        $this->assertCount(3, $response->json('data'));
    }

    public function test_member_can_list_project_assets(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        Asset::factory()->count(2)->create(['project_id' => $project->id]);

        $this->actingAsCreative();
        $response = $this->getJson("/api/projects/{$project->id}/assets");

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
    }

    public function test_non_member_cannot_list_project_assets(): void
    {
        $project = Project::factory()->create();

        $this->actingAsCreative();
        $response = $this->getJson("/api/projects/{$project->id}/assets");

        $response->assertForbidden();
    }

    public function test_assets_can_be_filtered_by_status(): void
    {
        $project = $this->createProjectWithMembers($this->admin);
        Asset::factory()->pendingReview()->count(2)->create(['project_id' => $project->id]);
        Asset::factory()->approved()->create(['project_id' => $project->id]);

        $this->actingAsAdmin();
        $response = $this->getJson("/api/projects/{$project->id}/assets?status=pending_review");

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
    }

    public function test_assets_can_be_filtered_by_type(): void
    {
        $project = $this->createProjectWithMembers($this->admin);
        Asset::factory()->image()->count(2)->create(['project_id' => $project->id]);
        Asset::factory()->video()->create(['project_id' => $project->id]);

        $this->actingAsAdmin();
        $response = $this->getJson("/api/projects/{$project->id}/assets?type=image");

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
    }

    // STORE TESTS

    public function test_admin_can_upload_asset(): void
    {
        $project = $this->createProjectWithMembers($this->admin);

        $this->actingAsAdmin();
        $response = $this->postJson("/api/projects/{$project->id}/assets", [
            'file' => $this->createTestFile('image'),
            'title' => 'Test Image',
            'description' => 'Test description',
        ]);

        $response->assertCreated()
            ->assertJsonPath('title', 'Test Image')
            ->assertJsonPath('type', 'image')
            ->assertJsonPath('status', 'pending_review')
            ->assertJsonPath('current_version', 1);

        $this->assertDatabaseHas('assets', [
            'title' => 'Test Image',
            'project_id' => $project->id,
            'uploaded_by' => $this->admin->id,
        ]);
    }

    public function test_pm_can_upload_asset_to_their_project(): void
    {
        $project = $this->createProjectWithMembers($this->pm);

        $this->actingAsPM();
        $response = $this->postJson("/api/projects/{$project->id}/assets", [
            'file' => $this->createTestFile('pdf'),
            'title' => 'PM Upload',
        ]);

        $response->assertCreated()
            ->assertJsonPath('type', 'pdf');
    }

    public function test_creative_member_can_upload_asset(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);

        $this->actingAsCreative();
        $response = $this->postJson("/api/projects/{$project->id}/assets", [
            'file' => $this->createTestFile('image'),
            'title' => 'Creative Upload',
        ]);

        $response->assertCreated()
            ->assertJsonPath('uploaded_by', $this->creative->id);
    }

    public function test_reviewer_cannot_upload_asset(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->reviewer]);

        $this->actingAsReviewer();
        $response = $this->postJson("/api/projects/{$project->id}/assets", [
            'file' => $this->createTestFile('image'),
            'title' => 'Reviewer Upload',
        ]);

        $response->assertForbidden();
    }

    public function test_asset_upload_requires_file(): void
    {
        $project = $this->createProjectWithMembers($this->admin);

        $this->actingAsAdmin();
        $response = $this->postJson("/api/projects/{$project->id}/assets", [
            'title' => 'No File',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['file']);
    }

    public function test_asset_upload_requires_title(): void
    {
        $project = $this->createProjectWithMembers($this->admin);

        $this->actingAsAdmin();
        $response = $this->postJson("/api/projects/{$project->id}/assets", [
            'file' => $this->createTestFile('image'),
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['title']);
    }

    public function test_asset_can_be_linked_to_request_on_upload(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $request = CreativeRequest::factory()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->actingAsCreative();
        $response = $this->postJson("/api/projects/{$project->id}/assets", [
            'file' => $this->createTestFile('image'),
            'title' => 'Linked Asset',
            'request_id' => $request->id,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('request_assets', [
            'asset_id' => $response->json('id'),
            'request_id' => $request->id,
        ]);
    }

    // SHOW TESTS

    public function test_member_can_view_asset_details(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        $this->actingAsPM();
        $response = $this->getJson("/api/assets/{$asset->id}");

        $response->assertOk()
            ->assertJsonStructure([
                'id', 'title', 'type', 'status',
                'project', 'uploader', 'versions', 'comments', 'approval_logs',
            ]);
    }

    public function test_pm_viewing_pending_asset_changes_status_to_in_review(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $asset->update(['status' => 'pending_review']);

        $this->actingAsPM();
        $response = $this->getJson("/api/assets/{$asset->id}");

        $response->assertOk()
            ->assertJsonPath('status', 'in_review');

        $this->assertDatabaseHas('assets', [
            'id' => $asset->id,
            'status' => 'in_review',
        ]);
    }

    public function test_non_member_cannot_view_asset(): void
    {
        $project = Project::factory()->create();
        $asset = Asset::factory()->create(['project_id' => $project->id]);

        $this->actingAsCreative();
        $response = $this->getJson("/api/assets/{$asset->id}");

        $response->assertForbidden();
    }

    // UPDATE TESTS

    public function test_admin_can_update_asset(): void
    {
        $project = $this->createProjectWithMembers($this->admin);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        $this->actingAsAdmin();
        $response = $this->patchJson("/api/assets/{$asset->id}", [
            'title' => 'Updated Title',
            'description' => 'Updated description',
        ]);

        $response->assertOk()
            ->assertJsonPath('title', 'Updated Title');
    }

    public function test_pm_member_can_update_asset(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        $this->actingAsPM();
        $response = $this->patchJson("/api/assets/{$asset->id}", [
            'title' => 'PM Updated',
        ]);

        $response->assertOk();
    }

    public function test_creative_can_update_own_asset(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        $this->actingAsCreative();
        $response = $this->patchJson("/api/assets/{$asset->id}", [
            'title' => 'Creative Updated',
        ]);

        $response->assertOk();
    }

    public function test_creative_cannot_update_others_asset(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $otherCreative = User::factory()->creative()->create();
        $asset = $this->createAssetWithVersion($project, $otherCreative);

        $this->actingAsCreative();
        $response = $this->patchJson("/api/assets/{$asset->id}", [
            'title' => 'Unauthorized Update',
        ]);

        $response->assertForbidden();
    }

    // DELETE TESTS

    public function test_admin_can_delete_asset(): void
    {
        $project = $this->createProjectWithMembers($this->admin);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        $this->actingAsAdmin();
        $response = $this->deleteJson("/api/assets/{$asset->id}");

        $response->assertOk()
            ->assertJson(['message' => 'Asset deleted successfully']);

        $this->assertDatabaseMissing('assets', ['id' => $asset->id]);
    }

    public function test_creative_can_delete_own_asset(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        $this->actingAsCreative();
        $response = $this->deleteJson("/api/assets/{$asset->id}");

        $response->assertOk();
    }

    public function test_creative_cannot_delete_others_asset(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->pm);

        $this->actingAsCreative();
        $response = $this->deleteJson("/api/assets/{$asset->id}");

        $response->assertForbidden();
    }

    // VERSION TESTS

    public function test_can_upload_new_version(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        $this->actingAsCreative();
        $response = $this->postJson("/api/assets/{$asset->id}/versions", [
            'file' => $this->createTestFile('image'),
        ]);

        $response->assertCreated()
            ->assertJsonPath('current_version', 2);

        $this->assertDatabaseHas('asset_versions', [
            'asset_id' => $asset->id,
            'version_number' => 2,
        ]);
    }

    public function test_uploading_version_resets_status_to_pending(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $asset->update(['status' => 'revision_requested']);

        $this->actingAsCreative();
        $response = $this->postJson("/api/assets/{$asset->id}/versions", [
            'file' => $this->createTestFile('image'),
        ]);

        $response->assertCreated()
            ->assertJsonPath('status', 'pending_review');
    }

    public function test_creative_cannot_upload_version_to_others_asset(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->pm);

        $this->actingAsCreative();
        $response = $this->postJson("/api/assets/{$asset->id}/versions", [
            'file' => $this->createTestFile('image'),
        ]);

        $response->assertForbidden();
    }

    public function test_can_list_asset_versions(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = Asset::factory()->create([
            'project_id' => $project->id,
            'uploaded_by' => $this->creative->id,
            'current_version' => 3,
        ]);
        AssetVersion::factory()->count(3)->sequence(
            ['version_number' => 1],
            ['version_number' => 2],
            ['version_number' => 3],
        )->create([
            'asset_id' => $asset->id,
            'uploaded_by' => $this->creative->id,
        ]);

        $this->actingAsPM();
        $response = $this->getJson("/api/assets/{$asset->id}/versions");

        $response->assertOk()
            ->assertJsonCount(3);
    }

    // APPROVAL TESTS

    public function test_pm_can_approve_asset(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        $this->actingAsPM();
        $response = $this->postJson("/api/assets/{$asset->id}/approve", [
            'comment' => 'Looks great!',
        ]);

        $response->assertOk()
            ->assertJsonPath('status', 'approved');

        $this->assertDatabaseHas('approval_logs', [
            'asset_id' => $asset->id,
            'user_id' => $this->pm->id,
            'action' => 'approved',
            'comment' => 'Looks great!',
        ]);
    }

    public function test_admin_can_approve_asset(): void
    {
        $project = Project::factory()->create();
        $asset = $this->createAssetWithVersion($project, $this->creative);

        $this->actingAsAdmin();
        $response = $this->postJson("/api/assets/{$asset->id}/approve");

        $response->assertOk()
            ->assertJsonPath('status', 'approved');
    }

    public function test_approval_auto_completes_linked_request(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        // Create a request and link it to the asset
        $request = CreativeRequest::factory()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
            'status' => 'asset_submitted',
        ]);
        $asset->creativeRequests()->attach($request->id);

        $this->actingAsPM();
        $response = $this->postJson("/api/assets/{$asset->id}/approve");

        $response->assertOk()
            ->assertJsonPath('status', 'approved');

        // Verify the linked request is auto-completed
        $this->assertDatabaseHas('creative_requests', [
            'id' => $request->id,
            'status' => 'completed',
        ]);
    }

    public function test_approval_does_not_affect_already_completed_request(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        // Create an already completed request
        $request = CreativeRequest::factory()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
            'status' => 'completed',
        ]);
        $asset->creativeRequests()->attach($request->id);

        $this->actingAsPM();
        $response = $this->postJson("/api/assets/{$asset->id}/approve");

        $response->assertOk();

        // Verify the request status is still completed (not changed)
        $this->assertDatabaseHas('creative_requests', [
            'id' => $request->id,
            'status' => 'completed',
        ]);
    }

    public function test_creative_cannot_approve_asset(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        $this->actingAsCreative();
        $response = $this->postJson("/api/assets/{$asset->id}/approve");

        $response->assertForbidden();
    }

    public function test_reviewer_can_approve_client_review_asset(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->reviewer]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $asset->update(['status' => 'client_review']);

        $this->actingAsReviewer();
        $response = $this->postJson("/api/assets/{$asset->id}/approve");

        $response->assertOk()
            ->assertJsonPath('status', 'approved');
    }

    public function test_reviewer_cannot_view_non_client_review_assets(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->reviewer]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $asset->update(['status' => 'pending_review']);

        $this->actingAsReviewer();
        $response = $this->getJson("/api/assets/{$asset->id}");

        $response->assertForbidden();
    }

    public function test_reviewer_can_view_client_review_assets(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->reviewer]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $asset->update(['status' => 'client_review']);

        $this->actingAsReviewer();
        $response = $this->getJson("/api/assets/{$asset->id}");

        $response->assertOk();
    }

    public function test_reviewer_can_request_revision_on_client_review_asset(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->reviewer]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $asset->update(['status' => 'client_review']);

        $this->actingAsReviewer();
        $response = $this->postJson("/api/assets/{$asset->id}/request-revision", [
            'comment' => 'Please adjust the colors',
        ]);

        $response->assertOk()
            ->assertJsonPath('status', 'revision_requested');
    }

    public function test_pm_can_send_asset_to_client_review(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $asset->update(['status' => 'in_review']);

        $this->actingAsPM();
        $response = $this->postJson("/api/assets/{$asset->id}/send-to-client");

        $response->assertOk()
            ->assertJsonPath('status', 'client_review');
    }

    public function test_admin_can_send_asset_to_client_review(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $asset->update(['status' => 'in_review']);

        $this->actingAsAdmin();
        $response = $this->postJson("/api/assets/{$asset->id}/send-to-client");

        $response->assertOk()
            ->assertJsonPath('status', 'client_review');
    }

    public function test_reviewer_cannot_send_to_client_review(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->reviewer]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $asset->update(['status' => 'client_review']);

        $this->actingAsReviewer();
        $response = $this->postJson("/api/assets/{$asset->id}/send-to-client");

        $response->assertForbidden();
    }

    public function test_creative_cannot_send_to_client_review(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $asset->update(['status' => 'in_review']);

        $this->actingAsCreative();
        $response = $this->postJson("/api/assets/{$asset->id}/send-to-client");

        $response->assertForbidden();
    }

    public function test_reviewer_only_sees_client_facing_assets_in_list(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->reviewer]);
        // These should NOT be visible to reviewer
        $this->createAssetWithVersion($project, $this->creative)->update(['status' => 'pending_review']);
        $this->createAssetWithVersion($project, $this->creative)->update(['status' => 'in_review']);
        // These SHOULD be visible to reviewer
        $this->createAssetWithVersion($project, $this->creative)->update(['status' => 'client_review']);
        $this->createAssetWithVersion($project, $this->creative)->update(['status' => 'approved']);
        $this->createAssetWithVersion($project, $this->creative)->update(['status' => 'revision_requested']);

        $this->actingAsReviewer();
        $response = $this->getJson("/api/projects/{$project->id}/assets");

        $response->assertOk();
        $this->assertCount(3, $response->json('data'));
        $statuses = collect($response->json('data'))->pluck('status')->all();
        $this->assertContains('client_review', $statuses);
        $this->assertContains('approved', $statuses);
        $this->assertContains('revision_requested', $statuses);
    }

    public function test_reviewer_can_view_approved_assets(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->reviewer]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $asset->update(['status' => 'approved']);

        $this->actingAsReviewer();
        $response = $this->getJson("/api/assets/{$asset->id}");

        $response->assertOk();
    }

    public function test_reviewer_can_view_revision_requested_assets(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->reviewer]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $asset->update(['status' => 'revision_requested']);

        $this->actingAsReviewer();
        $response = $this->getJson("/api/assets/{$asset->id}");

        $response->assertOk();
    }

    // REVISION REQUEST TESTS

    public function test_pm_can_request_revision(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        $this->actingAsPM();
        $response = $this->postJson("/api/assets/{$asset->id}/request-revision", [
            'comment' => 'Please adjust the colors',
        ]);

        $response->assertOk()
            ->assertJsonPath('status', 'revision_requested');

        $this->assertDatabaseHas('approval_logs', [
            'asset_id' => $asset->id,
            'action' => 'revision_requested',
            'comment' => 'Please adjust the colors',
        ]);
    }

    public function test_revision_request_requires_comment(): void
    {
        $project = $this->createProjectWithMembers($this->pm);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        $this->actingAsPM();
        $response = $this->postJson("/api/assets/{$asset->id}/request-revision", []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['comment']);
    }

    public function test_creative_cannot_request_revision(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->pm);

        $this->actingAsCreative();
        $response = $this->postJson("/api/assets/{$asset->id}/request-revision", [
            'comment' => 'Revision please',
        ]);

        $response->assertForbidden();
    }

    // LINK REQUEST TESTS

    public function test_can_link_asset_to_request(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $request = CreativeRequest::factory()->inProgress()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->actingAsCreative();
        $response = $this->postJson("/api/assets/{$asset->id}/link-request", [
            'request_id' => $request->id,
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('request_assets', [
            'asset_id' => $asset->id,
            'request_id' => $request->id,
        ]);

        // Verify request status updated
        $this->assertDatabaseHas('creative_requests', [
            'id' => $request->id,
            'status' => 'asset_submitted',
        ]);
    }

    public function test_link_request_requires_valid_request_id(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        $this->actingAsCreative();
        $response = $this->postJson("/api/assets/{$asset->id}/link-request", [
            'request_id' => 'invalid-uuid',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['request_id']);
    }

    // AUTO-ASSIGNMENT TESTS

    public function test_uploading_asset_auto_assigns_uploader_to_unassigned_request(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $request = CreativeRequest::factory()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => null,
        ]);

        $this->actingAsCreative();
        $response = $this->postJson("/api/projects/{$project->id}/assets", [
            'file' => $this->createTestFile('image'),
            'title' => 'Auto-assign Test',
            'request_id' => $request->id,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('creative_requests', [
            'id' => $request->id,
            'assigned_to' => $this->creative->id,
        ]);
    }

    public function test_uploading_asset_does_not_change_existing_assignee(): void
    {
        $otherCreative = User::factory()->creative()->create();
        $project = $this->createProjectWithMembers($this->pm, [$this->creative, $otherCreative]);
        $request = CreativeRequest::factory()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $otherCreative->id,
        ]);

        $this->actingAsCreative();
        $response = $this->postJson("/api/projects/{$project->id}/assets", [
            'file' => $this->createTestFile('image'),
            'title' => 'Should Not Reassign',
            'request_id' => $request->id,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('creative_requests', [
            'id' => $request->id,
            'assigned_to' => $otherCreative->id,
        ]);
    }

    public function test_linking_asset_auto_assigns_uploader_to_unassigned_request(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $request = CreativeRequest::factory()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => null,
        ]);

        $this->actingAsCreative();
        $response = $this->postJson("/api/assets/{$asset->id}/link-request", [
            'request_id' => $request->id,
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('creative_requests', [
            'id' => $request->id,
            'assigned_to' => $this->creative->id,
        ]);
    }

    public function test_linking_asset_does_not_change_existing_assignee(): void
    {
        $otherCreative = User::factory()->creative()->create();
        $project = $this->createProjectWithMembers($this->pm, [$this->creative, $otherCreative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);
        $request = CreativeRequest::factory()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $otherCreative->id,
        ]);

        $this->actingAsCreative();
        $response = $this->postJson("/api/assets/{$asset->id}/link-request", [
            'request_id' => $request->id,
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('creative_requests', [
            'id' => $request->id,
            'assigned_to' => $otherCreative->id,
        ]);
    }
}
