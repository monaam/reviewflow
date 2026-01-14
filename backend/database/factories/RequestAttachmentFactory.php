<?php

namespace Database\Factories;

use App\Models\CreativeRequest;
use App\Models\RequestAttachment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\RequestAttachment>
 */
class RequestAttachmentFactory extends Factory
{
    protected $model = RequestAttachment::class;

    public function definition(): array
    {
        return [
            'request_id' => CreativeRequest::factory(),
            'file_url' => fake()->url(),
            'file_name' => fake()->word() . '.' . fake()->randomElement(['pdf', 'docx', 'png', 'jpg']),
            'uploaded_by' => User::factory(),
        ];
    }
}
