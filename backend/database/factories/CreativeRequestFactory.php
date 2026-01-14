<?php

namespace Database\Factories;

use App\Models\CreativeRequest;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CreativeRequest>
 */
class CreativeRequestFactory extends Factory
{
    protected $model = CreativeRequest::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraphs(2, true),
            'created_by' => User::factory()->pm(),
            'assigned_to' => User::factory()->creative(),
            'deadline' => fake()->dateTimeBetween('+1 day', '+2 weeks'),
            'priority' => 'normal',
            'status' => 'pending',
            'specs' => [
                'format' => fake()->randomElement(['png', 'jpg', 'pdf']),
                'dimensions' => '1920x1080',
                'notes' => fake()->sentence(),
            ],
        ];
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
        ]);
    }

    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'in_progress',
        ]);
    }

    public function assetSubmitted(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'asset_submitted',
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'cancelled',
        ]);
    }

    public function lowPriority(): static
    {
        return $this->state(fn (array $attributes) => [
            'priority' => 'low',
        ]);
    }

    public function highPriority(): static
    {
        return $this->state(fn (array $attributes) => [
            'priority' => 'high',
        ]);
    }

    public function urgent(): static
    {
        return $this->state(fn (array $attributes) => [
            'priority' => 'urgent',
        ]);
    }

    public function overdue(): static
    {
        return $this->state(fn (array $attributes) => [
            'deadline' => fake()->dateTimeBetween('-1 week', '-1 day'),
            'status' => 'pending',
        ]);
    }
}
