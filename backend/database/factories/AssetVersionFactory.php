<?php

namespace Database\Factories;

use App\Models\Asset;
use App\Models\AssetVersion;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AssetVersion>
 */
class AssetVersionFactory extends Factory
{
    protected $model = AssetVersion::class;

    public function definition(): array
    {
        return [
            'asset_id' => Asset::factory(),
            'version_number' => 1,
            'file_url' => fake()->url(),
            'file_path' => 'assets/' . fake()->uuid() . '/' . fake()->uuid() . '.jpg',
            'file_size' => fake()->numberBetween(10000, 50000000),
            'file_meta' => [
                'original_name' => fake()->word() . '.jpg',
                'mime_type' => 'image/jpeg',
                'extension' => 'jpg',
                'width' => 1920,
                'height' => 1080,
            ],
            'uploaded_by' => User::factory(),
        ];
    }
}
