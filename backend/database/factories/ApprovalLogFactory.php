<?php

namespace Database\Factories;

use App\Models\ApprovalLog;
use App\Models\Asset;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ApprovalLog>
 */
class ApprovalLogFactory extends Factory
{
    protected $model = ApprovalLog::class;

    public function definition(): array
    {
        return [
            'asset_id' => Asset::factory(),
            'asset_version' => 1,
            'user_id' => User::factory()->pm(),
            'action' => 'approved',
            'comment' => fake()->optional()->sentence(),
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'action' => 'approved',
        ]);
    }

    public function revisionRequested(): static
    {
        return $this->state(fn (array $attributes) => [
            'action' => 'revision_requested',
            'comment' => fake()->paragraph(),
        ]);
    }

    public function reopened(): static
    {
        return $this->state(fn (array $attributes) => [
            'action' => 'reopened',
        ]);
    }
}
