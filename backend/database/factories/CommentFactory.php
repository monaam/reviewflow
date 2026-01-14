<?php

namespace Database\Factories;

use App\Models\Asset;
use App\Models\Comment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Comment>
 */
class CommentFactory extends Factory
{
    protected $model = Comment::class;

    public function definition(): array
    {
        return [
            'asset_id' => Asset::factory(),
            'asset_version' => 1,
            'user_id' => User::factory(),
            'content' => fake()->paragraph(),
            'rectangle' => null,
            'video_timestamp' => null,
            'is_resolved' => false,
            'resolved_by' => null,
            'resolved_at' => null,
        ];
    }

    public function resolved(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_resolved' => true,
            'resolved_by' => User::factory(),
            'resolved_at' => now(),
        ]);
    }

    public function withAnnotation(): static
    {
        return $this->state(fn (array $attributes) => [
            'rectangle' => [
                'x' => fake()->randomFloat(2, 0.1, 0.5),
                'y' => fake()->randomFloat(2, 0.1, 0.5),
                'width' => fake()->randomFloat(2, 0.1, 0.4),
                'height' => fake()->randomFloat(2, 0.1, 0.4),
            ],
        ]);
    }

    public function withTimestamp(): static
    {
        return $this->state(fn (array $attributes) => [
            'video_timestamp' => fake()->randomFloat(2, 0, 300),
        ]);
    }
}
