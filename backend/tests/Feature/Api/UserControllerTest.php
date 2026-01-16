<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\ApiTestHelpers;

class UserControllerTest extends TestCase
{
    use RefreshDatabase, ApiTestHelpers;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpUsers();
    }

    public function test_admin_can_list_users(): void
    {
        User::factory()->creative()->count(3)->create();

        $this->actingAsAdmin();
        $response = $this->getJson('/api/users');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'email', 'role'],
                ],
            ]);
    }

    public function test_pm_can_list_users(): void
    {
        User::factory()->creative()->count(3)->create();

        $this->actingAsPM();
        $response = $this->getJson('/api/users');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'email', 'role'],
                ],
            ]);
    }

    public function test_creative_cannot_list_users(): void
    {
        $this->actingAsCreative();
        $response = $this->getJson('/api/users');

        $response->assertForbidden();
    }

    public function test_reviewer_cannot_list_users(): void
    {
        $this->actingAsReviewer();
        $response = $this->getJson('/api/users');

        $response->assertForbidden();
    }

    public function test_users_can_be_filtered_by_role(): void
    {
        User::factory()->creative()->count(3)->create();
        User::factory()->reviewer()->count(2)->create();

        $this->actingAsPM();
        $response = $this->getJson('/api/users?role=creative');

        $response->assertOk();
        $this->assertCount(4, $response->json('data')); // 3 + setup creative
    }

    public function test_only_active_users_are_returned(): void
    {
        User::factory()->creative()->create(['is_active' => true]);
        User::factory()->creative()->create(['is_active' => false]);

        $this->actingAsPM();
        $response = $this->getJson('/api/users?role=creative');

        // Should only get active creatives (setup creative + 1 new active)
        foreach ($response->json('data') as $user) {
            $this->assertEquals('creative', $user['role']);
        }
    }

    public function test_users_can_be_searched(): void
    {
        User::factory()->creative()->create(['name' => 'John Designer']);
        User::factory()->creative()->create(['name' => 'Jane Artist']);

        $this->actingAsPM();
        $response = $this->getJson('/api/users?search=John');

        $response->assertOk();
        $this->assertTrue(
            collect($response->json('data'))->contains('name', 'John Designer')
        );
    }

    public function test_list_users_requires_authentication(): void
    {
        $response = $this->getJson('/api/users');

        $response->assertUnauthorized();
    }
}
