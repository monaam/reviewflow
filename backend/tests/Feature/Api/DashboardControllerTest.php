<?php

namespace Tests\Feature\Api;

use App\Models\Asset;
use App\Models\CreativeRequest;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\ApiTestHelpers;

class DashboardControllerTest extends TestCase
{
    use RefreshDatabase, ApiTestHelpers;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpUsers();
    }

    // ADMIN DASHBOARD TESTS

    public function test_admin_gets_admin_dashboard(): void
    {
        // Create explicit projects first to avoid implicit project creation
        $activeProjects = Project::factory()->active()->count(3)->create();
        $onHoldProjects = Project::factory()->onHold()->count(2)->create();

        // Create assets tied to existing projects
        Asset::factory()->pendingReview()->count(5)->create([
            'project_id' => $activeProjects->first()->id,
        ]);

        // Create overdue requests tied to existing projects
        CreativeRequest::factory()->overdue()->count(2)->create([
            'project_id' => $activeProjects->first()->id,
        ]);

        $this->actingAsAdmin();
        $response = $this->getJson('/api/dashboard');

        $response->assertOk()
            ->assertJsonPath('role', 'admin')
            ->assertJsonStructure([
                'role',
                'stats' => [
                    'total_projects',
                    'active_projects',
                    'pending_assets',
                    'overdue_requests',
                ],
                'recent_activity',
                'pending_approvals',
            ]);

        $this->assertEquals(5, $response->json('stats.total_projects'));
        $this->assertEquals(3, $response->json('stats.active_projects'));
        $this->assertEquals(5, $response->json('stats.pending_assets'));
        $this->assertEquals(2, $response->json('stats.overdue_requests'));
    }

    public function test_admin_dashboard_includes_pending_approvals(): void
    {
        $project = Project::factory()->create();
        Asset::factory()->pendingReview()->count(3)->create(['project_id' => $project->id]);
        Asset::factory()->approved()->create(['project_id' => $project->id]);

        $this->actingAsAdmin();
        $response = $this->getJson('/api/dashboard');

        $response->assertOk()
            ->assertJsonCount(3, 'pending_approvals');
    }

    public function test_admin_dashboard_includes_recent_activity(): void
    {
        Project::factory()->count(2)->create();
        Asset::factory()->count(3)->create();
        CreativeRequest::factory()->count(2)->create();

        $this->actingAsAdmin();
        $response = $this->getJson('/api/dashboard');

        $response->assertOk();
        $this->assertNotEmpty($response->json('recent_activity'));
    }

    // PM DASHBOARD TESTS

    public function test_pm_gets_pm_dashboard(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        Asset::factory()->pendingReview()->count(3)->create(['project_id' => $project->id]);
        CreativeRequest::factory()->count(2)->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->actingAsPM();
        $response = $this->getJson('/api/dashboard');

        $response->assertOk()
            ->assertJsonPath('role', 'pm')
            ->assertJsonStructure([
                'role',
                'stats' => [
                    'my_projects',
                    'pending_my_approval',
                    'requests_created',
                    'overdue_requests',
                ],
                'pending_approvals',
                'my_projects',
                'overdue_requests',
            ]);
    }

    public function test_pm_dashboard_shows_only_their_projects(): void
    {
        $pmProject = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $otherProject = Project::factory()->create();

        $this->actingAsPM();
        $response = $this->getJson('/api/dashboard');

        $response->assertOk()
            ->assertJsonPath('stats.my_projects', 1);
    }

    public function test_pm_dashboard_shows_pending_assets_in_their_projects(): void
    {
        $pmProject = $this->createProjectWithMembers($this->pm, [$this->creative]);
        Asset::factory()->pendingReview()->count(3)->create(['project_id' => $pmProject->id]);

        // Assets in other projects should not count
        $otherProject = Project::factory()->create();
        Asset::factory()->pendingReview()->count(5)->create(['project_id' => $otherProject->id]);

        $this->actingAsPM();
        $response = $this->getJson('/api/dashboard');

        $response->assertOk()
            ->assertJsonPath('stats.pending_my_approval', 3);
    }

    public function test_pm_dashboard_shows_overdue_requests(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        CreativeRequest::factory()->overdue()->count(2)->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->actingAsPM();
        $response = $this->getJson('/api/dashboard');

        $response->assertOk()
            ->assertJsonPath('stats.overdue_requests', 2);
    }

    // CREATIVE DASHBOARD TESTS

    public function test_creative_gets_creative_dashboard(): void
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
        Asset::factory()->count(3)->create([
            'project_id' => $project->id,
            'uploaded_by' => $this->creative->id,
        ]);
        Asset::factory()->revisionRequested()->create([
            'project_id' => $project->id,
            'uploaded_by' => $this->creative->id,
        ]);

        $this->actingAsCreative();
        $response = $this->getJson('/api/dashboard');

        $response->assertOk()
            ->assertJsonPath('role', 'creative')
            ->assertJsonStructure([
                'role',
                'stats' => [
                    'assigned_requests',
                    'pending_requests',
                    'my_assets',
                    'revision_requested',
                ],
                'my_queue',
                'revision_needed',
                'recent_uploads',
            ]);

        $this->assertEquals(3, $response->json('stats.assigned_requests')); // pending + in_progress
        $this->assertEquals(2, $response->json('stats.pending_requests'));
        $this->assertEquals(4, $response->json('stats.my_assets'));
        $this->assertEquals(1, $response->json('stats.revision_requested'));
    }

    public function test_creative_dashboard_shows_their_queue(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        CreativeRequest::factory()->pending()->count(2)->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);
        // Completed request should not appear in queue
        CreativeRequest::factory()->completed()->create([
            'project_id' => $project->id,
            'created_by' => $this->pm->id,
            'assigned_to' => $this->creative->id,
        ]);

        $this->actingAsCreative();
        $response = $this->getJson('/api/dashboard');

        $response->assertOk()
            ->assertJsonCount(2, 'my_queue');
    }

    public function test_creative_dashboard_shows_revision_needed_assets(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        Asset::factory()->revisionRequested()->count(2)->create([
            'project_id' => $project->id,
            'uploaded_by' => $this->creative->id,
        ]);
        Asset::factory()->approved()->create([
            'project_id' => $project->id,
            'uploaded_by' => $this->creative->id,
        ]);

        $this->actingAsCreative();
        $response = $this->getJson('/api/dashboard');

        $response->assertOk()
            ->assertJsonCount(2, 'revision_needed');
    }

    // REVIEWER DASHBOARD TESTS

    public function test_reviewer_gets_reviewer_dashboard(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->reviewer]);
        Asset::factory()->pendingReview()->count(3)->create(['project_id' => $project->id]);

        $this->actingAsReviewer();
        $response = $this->getJson('/api/dashboard');

        $response->assertOk()
            ->assertJsonPath('role', 'reviewer')
            ->assertJsonStructure([
                'role',
                'stats' => [
                    'accessible_projects',
                    'pending_review',
                ],
                'pending_review',
            ]);
    }

    public function test_reviewer_dashboard_shows_only_accessible_projects(): void
    {
        $accessibleProject = $this->createProjectWithMembers($this->pm, [$this->reviewer]);
        $inaccessibleProject = Project::factory()->create();

        // Reviewers only see client_review assets (sent to them by PM)
        Asset::factory()->clientReview()->count(3)->create(['project_id' => $accessibleProject->id]);
        Asset::factory()->clientReview()->count(5)->create(['project_id' => $inaccessibleProject->id]);

        $this->actingAsReviewer();
        $response = $this->getJson('/api/dashboard');

        $response->assertOk()
            ->assertJsonPath('stats.accessible_projects', 1)
            ->assertJsonPath('stats.pending_review', 3);
    }

    public function test_reviewer_dashboard_includes_client_review_assets(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->reviewer]);
        // Reviewers see client_review assets (sent to them), not internal pending_review
        Asset::factory()->clientReview()->count(3)->create(['project_id' => $project->id]);
        Asset::factory()->pendingReview()->count(2)->create(['project_id' => $project->id]); // Not visible to reviewer
        Asset::factory()->approved()->count(2)->create(['project_id' => $project->id]);

        $this->actingAsReviewer();
        $response = $this->getJson('/api/dashboard');

        $response->assertOk()
            ->assertJsonCount(3, 'pending_review'); // Only client_review assets
    }

    // AUTHENTICATION TESTS

    public function test_dashboard_requires_authentication(): void
    {
        $response = $this->getJson('/api/dashboard');

        $response->assertUnauthorized();
    }
}
