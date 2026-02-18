<?php

namespace Tests\Feature\Api;

use App\Models\Asset;
use App\Models\AssetVersion;
use App\Models\CreativeRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Tests\Traits\ApiTestHelpers;

class DocumentAssetControllerTest extends TestCase
{
    use RefreshDatabase, ApiTestHelpers;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpUsers();
        Storage::fake('local');
    }

    // CREATION TESTS

    public function test_pm_can_create_document_asset(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);

        $this->actingAsPM();
        $response = $this->postJson("/api/projects/{$project->id}/assets/document", [
            'title' => 'Test Document',
            'description' => 'A test document.',
            'content' => '<p>Hello world. This is test content.</p>',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('type', 'document')
            ->assertJsonPath('status', 'in_review')
            ->assertJsonPath('current_version', 1);

        $asset = Asset::find($response->json('id'));
        $version = $asset->versions()->first();
        $this->assertNotNull($version->content);
        $this->assertNull($version->file_url);
        $this->assertNull($version->file_path);
        $this->assertArrayHasKey('word_count', $version->file_meta);
    }

    public function test_creative_can_create_document_asset(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);

        $this->actingAsCreative();
        $response = $this->postJson("/api/projects/{$project->id}/assets/document", [
            'title' => 'Creative Document',
            'content' => '<p>Content from creative.</p>',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'pending_review');
    }

    public function test_admin_can_create_document_asset(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);

        $this->actingAsAdmin();
        $response = $this->postJson("/api/projects/{$project->id}/assets/document", [
            'title' => 'Admin Document',
            'content' => '<p>Admin content.</p>',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'in_review');
    }

    public function test_reviewer_cannot_create_document_asset(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->reviewer]);

        $this->actingAsReviewer();
        $response = $this->postJson("/api/projects/{$project->id}/assets/document", [
            'title' => 'Reviewer Document',
            'content' => '<p>Content.</p>',
        ]);

        $response->assertForbidden();
    }

    public function test_non_member_cannot_create_document_asset(): void
    {
        $project = $this->createProjectWithMembers($this->pm);

        $this->actingAsCreative();
        $response = $this->postJson("/api/projects/{$project->id}/assets/document", [
            'title' => 'Non-member Document',
            'content' => '<p>Content.</p>',
        ]);

        $response->assertForbidden();
    }

    public function test_document_creation_requires_title(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);

        $this->actingAsPM();
        $response = $this->postJson("/api/projects/{$project->id}/assets/document", [
            'content' => '<p>Content.</p>',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title']);
    }

    public function test_document_creation_requires_content(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);

        $this->actingAsPM();
        $response = $this->postJson("/api/projects/{$project->id}/assets/document", [
            'title' => 'Test',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['content']);
    }

    public function test_document_can_be_linked_to_request_on_creation(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $request = CreativeRequest::factory()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
        ]);

        $this->actingAsPM();
        $response = $this->postJson("/api/projects/{$project->id}/assets/document", [
            'title' => 'Linked Document',
            'content' => '<p>Linked content.</p>',
            'request_id' => $request->id,
        ]);

        $response->assertStatus(201);
        $asset = Asset::find($response->json('id'));
        $this->assertTrue($asset->creativeRequests->contains($request->id));
    }

    public function test_document_content_is_sanitized(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);

        $this->actingAsPM();
        $response = $this->postJson("/api/projects/{$project->id}/assets/document", [
            'title' => 'Sanitized Document',
            'content' => '<p>Hello</p><script>alert("xss")</script><strong>world</strong>',
        ]);

        $response->assertStatus(201);
        $asset = Asset::find($response->json('id'));
        $version = $asset->versions()->first();
        $this->assertStringNotContainsString('<script>', $version->content);
        $this->assertStringContainsString('<strong>world</strong>', $version->content);
    }

    public function test_document_creation_auto_assigns_unassigned_request(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $request = CreativeRequest::factory()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => null,
        ]);

        $this->actingAsCreative();
        $this->postJson("/api/projects/{$project->id}/assets/document", [
            'title' => 'Auto-assign Document',
            'content' => '<p>Content.</p>',
            'request_id' => $request->id,
        ]);

        $request->refresh();
        $this->assertEquals($this->creative->id, $request->assigned_to);
    }

    // VERSIONING TESTS

    public function test_can_submit_new_document_version(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createDocumentAsset($project, $this->pm);

        $this->actingAsPM();
        $response = $this->postJson("/api/assets/{$asset->id}/document-versions", [
            'content' => '<p>Updated content for version 2.</p>',
            'version_notes' => 'Updated the intro',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('current_version', 2);

        $newVersion = AssetVersion::where('asset_id', $asset->id)
            ->where('version_number', 2)
            ->first();
        $this->assertNotNull($newVersion);
        $this->assertStringContainsString('Updated content', $newVersion->content);
    }

    public function test_document_version_resets_status(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createDocumentAsset($project, $this->creative);
        $asset->update(['status' => 'revision_requested']);

        $this->actingAsCreative();
        $response = $this->postJson("/api/assets/{$asset->id}/document-versions", [
            'content' => '<p>Revised content.</p>',
        ]);

        $response->assertStatus(201);
        $asset->refresh();
        $this->assertEquals('pending_review', $asset->status);
    }

    public function test_cannot_submit_document_version_for_non_document_asset(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->pm);

        $this->actingAsPM();
        $response = $this->postJson("/api/assets/{$asset->id}/document-versions", [
            'content' => '<p>Should fail.</p>',
        ]);

        $response->assertStatus(422);
    }

    public function test_cannot_submit_document_version_when_locked(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createDocumentAsset($project, $this->pm);
        $asset->lock($this->pm);

        $this->actingAsPM();
        $response = $this->postJson("/api/assets/{$asset->id}/document-versions", [
            'content' => '<p>Should fail.</p>',
        ]);

        $response->assertStatus(403);
    }

    public function test_creative_cannot_submit_version_to_others_document(): void
    {
        $project = $this->createProjectWithMembers($this->pm);
        $asset = $this->createDocumentAsset($project, $this->pm);

        $this->actingAsCreative();
        $response = $this->postJson("/api/assets/{$asset->id}/document-versions", [
            'content' => '<p>Should fail.</p>',
        ]);

        $response->assertForbidden();
    }

    public function test_document_version_requires_content(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createDocumentAsset($project, $this->pm);

        $this->actingAsPM();
        $response = $this->postJson("/api/assets/{$asset->id}/document-versions", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['content']);
    }

    // SHOW/VIEW TESTS

    public function test_member_can_view_document_asset(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createDocumentAsset($project, $this->pm);

        $this->actingAsPM();
        $response = $this->getJson("/api/assets/{$asset->id}");

        $response->assertOk()
            ->assertJsonPath('type', 'document');

        $versions = $response->json('versions');
        $this->assertNotEmpty($versions);
        $this->assertNotNull($versions[0]['content']);
    }

    public function test_pm_viewing_pending_document_changes_status(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createDocumentAsset($project, $this->creative);
        $this->assertEquals('pending_review', $asset->status);

        $this->actingAsPM();
        $this->getJson("/api/assets/{$asset->id}");

        $asset->refresh();
        $this->assertEquals('in_review', $asset->status);
    }

    // APPROVAL FLOW TESTS

    public function test_pm_can_approve_document_asset(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createDocumentAsset($project, $this->creative);
        $asset->update(['status' => 'in_review']);

        $this->actingAsPM();
        $response = $this->postJson("/api/assets/{$asset->id}/approve", [
            'comment' => 'Looks great!',
        ]);

        $response->assertOk();
        $asset->refresh();
        $this->assertEquals('approved', $asset->status);
    }

    public function test_pm_can_request_revision_on_document(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createDocumentAsset($project, $this->creative);
        $asset->update(['status' => 'in_review']);

        $this->actingAsPM();
        $response = $this->postJson("/api/assets/{$asset->id}/request-revision", [
            'comment' => 'Needs more detail.',
        ]);

        $response->assertOk();
        $asset->refresh();
        $this->assertEquals('revision_requested', $asset->status);
    }

    // HELPER

    protected function createDocumentAsset($project, $uploader): Asset
    {
        $asset = Asset::factory()->document()->create([
            'project_id' => $project->id,
            'uploaded_by' => $uploader->id,
            'status' => $uploader->isPM() || $uploader->isAdmin() ? 'in_review' : 'pending_review',
        ]);

        AssetVersion::factory()->document()->create([
            'asset_id' => $asset->id,
            'version_number' => 1,
            'uploaded_by' => $uploader->id,
        ]);

        return $asset;
    }
}
