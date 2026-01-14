<?php

namespace Tests\Feature\Api;

use App\Models\Asset;
use App\Models\CreativeRequest;
use App\Models\Project;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\ApiTestHelpers;

class AdminControllerTest extends TestCase
{
    use RefreshDatabase, ApiTestHelpers;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpUsers();
    }

    // AUTHORIZATION TESTS

    public function test_non_admin_cannot_access_admin_routes(): void
    {
        $this->actingAsPM();
        $this->getJson('/api/admin/users')->assertForbidden();

        $this->actingAsCreative();
        $this->getJson('/api/admin/users')->assertForbidden();

        $this->actingAsReviewer();
        $this->getJson('/api/admin/users')->assertForbidden();
    }

    public function test_admin_routes_require_authentication(): void
    {
        $this->getJson('/api/admin/users')->assertUnauthorized();
        $this->postJson('/api/admin/users')->assertUnauthorized();
        $this->getJson('/api/admin/settings')->assertUnauthorized();
        $this->getJson('/api/admin/analytics')->assertUnauthorized();
    }

    // USER LIST TESTS

    public function test_admin_can_list_users(): void
    {
        User::factory()->count(5)->create();

        $this->actingAsAdmin();
        $response = $this->getJson('/api/admin/users');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'email', 'role', 'is_active'],
                ],
                'current_page',
                'total',
            ]);
    }

    public function test_users_can_be_filtered_by_role(): void
    {
        User::factory()->pm()->count(3)->create();
        User::factory()->creative()->count(2)->create();

        $this->actingAsAdmin();
        $response = $this->getJson('/api/admin/users?role=pm');

        $response->assertOk();
        foreach ($response->json('data') as $user) {
            $this->assertEquals('pm', $user['role']);
        }
    }

    public function test_users_can_be_filtered_by_active_status(): void
    {
        User::factory()->count(3)->create(['is_active' => true]);
        User::factory()->inactive()->count(2)->create();

        $this->actingAsAdmin();
        $response = $this->getJson('/api/admin/users?active=false');

        $response->assertOk();
        foreach ($response->json('data') as $user) {
            $this->assertFalse($user['is_active']);
        }
    }

    public function test_users_can_be_searched_by_name(): void
    {
        User::factory()->create(['name' => 'John Smith']);
        User::factory()->create(['name' => 'Jane Doe']);
        User::factory()->create(['name' => 'Alice Johnson']);

        $this->actingAsAdmin();
        $response = $this->getJson('/api/admin/users?search=John');

        $response->assertOk();
        $names = collect($response->json('data'))->pluck('name')->toArray();
        $this->assertTrue(
            collect($names)->contains(fn($name) => str_contains($name, 'John'))
        );
    }

    public function test_users_can_be_searched_by_email(): void
    {
        User::factory()->create(['email' => 'john@example.com']);
        User::factory()->create(['email' => 'jane@example.com']);

        $this->actingAsAdmin();
        $response = $this->getJson('/api/admin/users?search=john@');

        $response->assertOk();
        $emails = collect($response->json('data'))->pluck('email')->toArray();
        $this->assertTrue(
            collect($emails)->contains(fn($email) => str_contains($email, 'john@'))
        );
    }

    // CREATE USER TESTS

    public function test_admin_can_create_user(): void
    {
        $this->actingAsAdmin();
        $response = $this->postJson('/api/admin/users', [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'password' => 'password123',
            'role' => 'creative',
        ]);

        $response->assertCreated()
            ->assertJsonPath('name', 'New User')
            ->assertJsonPath('email', 'newuser@example.com')
            ->assertJsonPath('role', 'creative')
            ->assertJsonPath('is_active', true);

        $this->assertDatabaseHas('users', [
            'email' => 'newuser@example.com',
        ]);
    }

    public function test_create_user_requires_all_fields(): void
    {
        $this->actingAsAdmin();
        $response = $this->postJson('/api/admin/users', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'password', 'role']);
    }

    public function test_create_user_validates_unique_email(): void
    {
        $existingUser = User::factory()->create(['email' => 'existing@example.com']);

        $this->actingAsAdmin();
        $response = $this->postJson('/api/admin/users', [
            'name' => 'New User',
            'email' => 'existing@example.com',
            'password' => 'password123',
            'role' => 'creative',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_create_user_validates_role(): void
    {
        $this->actingAsAdmin();
        $response = $this->postJson('/api/admin/users', [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'password' => 'password123',
            'role' => 'invalid_role',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['role']);
    }

    public function test_create_user_validates_password_length(): void
    {
        $this->actingAsAdmin();
        $response = $this->postJson('/api/admin/users', [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'password' => 'short',
            'role' => 'creative',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    // UPDATE USER TESTS

    public function test_admin_can_update_user(): void
    {
        $user = User::factory()->creative()->create();

        $this->actingAsAdmin();
        $response = $this->patchJson("/api/admin/users/{$user->id}", [
            'name' => 'Updated Name',
            'role' => 'pm',
        ]);

        $response->assertOk()
            ->assertJsonPath('name', 'Updated Name')
            ->assertJsonPath('role', 'pm');
    }

    public function test_admin_can_update_user_email(): void
    {
        $user = User::factory()->create();

        $this->actingAsAdmin();
        $response = $this->patchJson("/api/admin/users/{$user->id}", [
            'email' => 'newemail@example.com',
        ]);

        $response->assertOk()
            ->assertJsonPath('email', 'newemail@example.com');
    }

    public function test_admin_can_update_user_password(): void
    {
        $user = User::factory()->create();

        $this->actingAsAdmin();
        $response = $this->patchJson("/api/admin/users/{$user->id}", [
            'password' => 'newpassword123',
        ]);

        $response->assertOk();

        // Verify can login with new password
        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'newpassword123',
        ])->assertOk();
    }

    public function test_admin_can_deactivate_user(): void
    {
        $user = User::factory()->create(['is_active' => true]);

        $this->actingAsAdmin();
        $response = $this->patchJson("/api/admin/users/{$user->id}", [
            'is_active' => false,
        ]);

        $response->assertOk()
            ->assertJsonPath('is_active', false);
    }

    public function test_admin_can_reactivate_user(): void
    {
        $user = User::factory()->inactive()->create();

        $this->actingAsAdmin();
        $response = $this->patchJson("/api/admin/users/{$user->id}", [
            'is_active' => true,
        ]);

        $response->assertOk()
            ->assertJsonPath('is_active', true);
    }

    public function test_update_user_validates_unique_email(): void
    {
        $existingUser = User::factory()->create(['email' => 'existing@example.com']);
        $user = User::factory()->create();

        $this->actingAsAdmin();
        $response = $this->patchJson("/api/admin/users/{$user->id}", [
            'email' => 'existing@example.com',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    // DELETE USER TESTS

    public function test_admin_can_delete_user(): void
    {
        $user = User::factory()->create();

        $this->actingAsAdmin();
        $response = $this->deleteJson("/api/admin/users/{$user->id}");

        $response->assertOk()
            ->assertJson(['message' => 'User deleted successfully']);

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_admin_cannot_delete_themselves(): void
    {
        $this->actingAsAdmin();
        $response = $this->deleteJson("/api/admin/users/{$this->admin->id}");

        $response->assertStatus(400)
            ->assertJson(['error' => 'Cannot delete your own account']);

        $this->assertDatabaseHas('users', ['id' => $this->admin->id]);
    }

    // SETTINGS TESTS

    public function test_admin_can_get_settings(): void
    {
        Setting::set('discord_webhook_url', 'https://discord.com/api/webhooks/123/abc');

        $this->actingAsAdmin();
        $response = $this->getJson('/api/admin/settings');

        $response->assertOk()
            ->assertJsonPath('discord_webhook_url', 'https://discord.com/api/webhooks/123/abc');
    }

    public function test_admin_can_update_settings(): void
    {
        $this->actingAsAdmin();
        $response = $this->patchJson('/api/admin/settings', [
            'discord_webhook_url' => 'https://discord.com/api/webhooks/456/def',
        ]);

        $response->assertOk()
            ->assertJsonPath('discord_webhook_url', 'https://discord.com/api/webhooks/456/def');

        $this->assertEquals(
            'https://discord.com/api/webhooks/456/def',
            Setting::get('discord_webhook_url')
        );
    }

    public function test_admin_can_clear_setting(): void
    {
        Setting::set('discord_webhook_url', 'https://discord.com/api/webhooks/123/abc');

        $this->actingAsAdmin();
        $response = $this->patchJson('/api/admin/settings', [
            'discord_webhook_url' => null,
        ]);

        $response->assertOk();
        $this->assertNull(Setting::get('discord_webhook_url'));
    }

    public function test_settings_validates_discord_webhook_url(): void
    {
        $this->actingAsAdmin();
        $response = $this->patchJson('/api/admin/settings', [
            'discord_webhook_url' => 'not-a-valid-url',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['discord_webhook_url']);
    }

    // ANALYTICS TESTS

    public function test_admin_can_get_analytics(): void
    {
        // Create some data
        Project::factory()->active()->count(5)->create();
        Project::factory()->onHold()->count(2)->create();
        Asset::factory()->pendingReview()->count(3)->create();
        Asset::factory()->approved()->count(10)->create();
        Asset::factory()->revisionRequested()->count(2)->create();
        CreativeRequest::factory()->pending()->count(4)->create();
        CreativeRequest::factory()->overdue()->count(2)->create();
        User::factory()->count(10)->create();
        User::factory()->inactive()->count(2)->create();

        $this->actingAsAdmin();
        $response = $this->getJson('/api/admin/analytics');

        $response->assertOk()
            ->assertJsonStructure([
                'stats' => [
                    'total_projects',
                    'active_projects',
                    'total_assets',
                    'pending_assets',
                    'approved_assets',
                    'revision_requested',
                    'total_requests',
                    'pending_requests',
                    'overdue_requests',
                    'total_users',
                    'active_users',
                    'approval_rate',
                    'avg_revision_rounds',
                ],
                'assets_by_date',
            ]);
    }

    public function test_analytics_can_be_filtered_by_period(): void
    {
        $this->actingAsAdmin();
        $response = $this->getJson('/api/admin/analytics?period=7');

        $response->assertOk()
            ->assertJsonStructure([
                'stats',
                'assets_by_date',
            ]);
    }

    public function test_analytics_calculates_approval_rate(): void
    {
        Asset::factory()->approved()->count(8)->create();
        Asset::factory()->revisionRequested()->count(2)->create();
        // Pending assets should not be counted
        Asset::factory()->pendingReview()->count(5)->create();

        $this->actingAsAdmin();
        $response = $this->getJson('/api/admin/analytics');

        $response->assertOk();
        // 8 approved out of 10 processed = 80%
        $this->assertEquals(80, $response->json('stats.approval_rate'));
    }

    public function test_analytics_handles_zero_assets(): void
    {
        $this->actingAsAdmin();
        $response = $this->getJson('/api/admin/analytics');

        $response->assertOk()
            ->assertJsonPath('stats.total_assets', 0)
            ->assertJsonPath('stats.approval_rate', 0);
    }
}
