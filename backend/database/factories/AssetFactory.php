<?php

namespace Database\Factories;

use App\Models\Asset;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Asset>
 */
class AssetFactory extends Factory
{
    protected $model = Asset::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'uploaded_by' => User::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'type' => fake()->randomElement(['image', 'video', 'pdf', 'design']),
            'status' => 'pending_review',
            'current_version' => 1,
            'deadline' => fake()->optional()->dateTimeBetween('+1 day', '+2 weeks'),
        ];
    }

    public function pendingReview(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending_review',
        ]);
    }

    public function inReview(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'in_review',
        ]);
    }

    public function clientReview(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'client_review',
        ]);
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
        ]);
    }

    public function revisionRequested(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'revision_requested',
        ]);
    }

    public function image(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'image',
        ]);
    }

    public function video(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'video',
        ]);
    }

    public function pdf(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'pdf',
        ]);
    }
}
