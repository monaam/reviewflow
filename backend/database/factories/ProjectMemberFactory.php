<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProjectMember>
 */
class ProjectMemberFactory extends Factory
{
    protected $model = ProjectMember::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'user_id' => User::factory(),
            'role_in_project' => 'member',
            'notify_on_upload' => true,
            'notify_on_comment' => true,
            'notify_on_approval' => true,
        ];
    }

    public function owner(): static
    {
        return $this->state(fn (array $attributes) => [
            'role_in_project' => 'owner',
        ]);
    }

    public function member(): static
    {
        return $this->state(fn (array $attributes) => [
            'role_in_project' => 'member',
        ]);
    }
}
