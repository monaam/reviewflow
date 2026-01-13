<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\AssetVersion;
use App\Models\CreativeRequest;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create admin user
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@reviewflow.test',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        // Create PM users
        $pm1 = User::create([
            'name' => 'Sarah Project Manager',
            'email' => 'pm@reviewflow.test',
            'password' => Hash::make('password'),
            'role' => 'pm',
        ]);

        $pm2 = User::create([
            'name' => 'John Account Manager',
            'email' => 'john@reviewflow.test',
            'password' => Hash::make('password'),
            'role' => 'pm',
        ]);

        // Create Creative users
        $creative1 = User::create([
            'name' => 'Alex Designer',
            'email' => 'designer@reviewflow.test',
            'password' => Hash::make('password'),
            'role' => 'creative',
        ]);

        $creative2 = User::create([
            'name' => 'Emma Motion Designer',
            'email' => 'emma@reviewflow.test',
            'password' => Hash::make('password'),
            'role' => 'creative',
        ]);

        // Create Reviewer user
        $reviewer = User::create([
            'name' => 'Client Reviewer',
            'email' => 'reviewer@reviewflow.test',
            'password' => Hash::make('password'),
            'role' => 'reviewer',
        ]);

        // Create Projects
        $project1 = Project::create([
            'name' => 'Nike Summer Campaign',
            'description' => 'Creative assets for Nike summer marketing campaign 2026',
            'client_name' => 'Nike Inc.',
            'deadline' => now()->addDays(30),
            'status' => 'active',
            'created_by' => $pm1->id,
        ]);

        $project2 = Project::create([
            'name' => 'Tech Startup Rebrand',
            'description' => 'Complete rebrand for a B2B SaaS startup',
            'client_name' => 'TechFlow Inc.',
            'deadline' => now()->addDays(45),
            'status' => 'active',
            'created_by' => $pm2->id,
        ]);

        $project3 = Project::create([
            'name' => 'Holiday Campaign 2026',
            'description' => 'Holiday season marketing materials',
            'client_name' => 'Retail Corp',
            'deadline' => now()->addDays(60),
            'status' => 'active',
            'created_by' => $pm1->id,
        ]);

        // Add members to projects
        ProjectMember::create([
            'project_id' => $project1->id,
            'user_id' => $pm1->id,
            'role_in_project' => 'owner',
        ]);

        ProjectMember::create([
            'project_id' => $project1->id,
            'user_id' => $creative1->id,
            'role_in_project' => 'member',
        ]);

        ProjectMember::create([
            'project_id' => $project1->id,
            'user_id' => $creative2->id,
            'role_in_project' => 'member',
        ]);

        ProjectMember::create([
            'project_id' => $project2->id,
            'user_id' => $pm2->id,
            'role_in_project' => 'owner',
        ]);

        ProjectMember::create([
            'project_id' => $project2->id,
            'user_id' => $creative1->id,
            'role_in_project' => 'member',
        ]);

        ProjectMember::create([
            'project_id' => $project3->id,
            'user_id' => $pm1->id,
            'role_in_project' => 'owner',
        ]);

        ProjectMember::create([
            'project_id' => $project3->id,
            'user_id' => $creative2->id,
            'role_in_project' => 'member',
        ]);

        // Create Creative Requests
        $request1 = CreativeRequest::create([
            'project_id' => $project1->id,
            'title' => 'Homepage Banner - Summer Theme',
            'description' => 'Create a hero banner for the Nike summer campaign homepage. Size: 1920x1080. Use bright, energetic colors.',
            'created_by' => $pm1->id,
            'assigned_to' => $creative1->id,
            'deadline' => now()->addDays(5),
            'priority' => 'high',
            'status' => 'in_progress',
            'specs' => ['dimensions' => '1920x1080', 'format' => 'PNG'],
        ]);

        $request2 = CreativeRequest::create([
            'project_id' => $project1->id,
            'title' => 'Social Media Kit - Instagram',
            'description' => 'Design 5 Instagram posts and 3 stories for the summer campaign.',
            'created_by' => $pm1->id,
            'assigned_to' => $creative2->id,
            'deadline' => now()->addDays(7),
            'priority' => 'normal',
            'status' => 'pending',
            'specs' => ['posts' => '1080x1080', 'stories' => '1080x1920'],
        ]);

        $request3 = CreativeRequest::create([
            'project_id' => $project2->id,
            'title' => 'Logo Design - Primary Version',
            'description' => 'Design a modern, minimalist logo for TechFlow. Should work in both dark and light backgrounds.',
            'created_by' => $pm2->id,
            'assigned_to' => $creative1->id,
            'deadline' => now()->addDays(10),
            'priority' => 'urgent',
            'status' => 'pending',
        ]);

        // Create some sample assets
        $asset1 = Asset::create([
            'project_id' => $project1->id,
            'uploaded_by' => $creative1->id,
            'title' => 'Nike Banner Draft v1',
            'description' => 'Initial concept for the summer campaign banner',
            'type' => 'image',
            'status' => 'pending_review',
            'current_version' => 1,
        ]);

        AssetVersion::create([
            'asset_id' => $asset1->id,
            'version_number' => 1,
            'file_url' => '/storage/assets/sample-banner-1.png',
            'file_path' => 'assets/sample-banner-1.png',
            'file_size' => 1024000,
            'file_meta' => ['width' => 1920, 'height' => 1080, 'mime_type' => 'image/png'],
            'uploaded_by' => $creative1->id,
        ]);

        $asset2 = Asset::create([
            'project_id' => $project1->id,
            'uploaded_by' => $creative1->id,
            'title' => 'Product Showcase Video',
            'description' => '30 second product showcase for social media',
            'type' => 'video',
            'status' => 'revision_requested',
            'current_version' => 2,
        ]);

        AssetVersion::create([
            'asset_id' => $asset2->id,
            'version_number' => 1,
            'file_url' => '/storage/assets/product-v1.mp4',
            'file_path' => 'assets/product-v1.mp4',
            'file_size' => 50000000,
            'file_meta' => ['duration' => 30, 'mime_type' => 'video/mp4'],
            'uploaded_by' => $creative1->id,
        ]);

        AssetVersion::create([
            'asset_id' => $asset2->id,
            'version_number' => 2,
            'file_url' => '/storage/assets/product-v2.mp4',
            'file_path' => 'assets/product-v2.mp4',
            'file_size' => 48000000,
            'file_meta' => ['duration' => 28, 'mime_type' => 'video/mp4'],
            'uploaded_by' => $creative1->id,
        ]);

        $asset3 = Asset::create([
            'project_id' => $project2->id,
            'uploaded_by' => $creative1->id,
            'title' => 'TechFlow Logo Concept A',
            'description' => 'First logo concept for TechFlow rebrand',
            'type' => 'image',
            'status' => 'approved',
            'current_version' => 1,
        ]);

        AssetVersion::create([
            'asset_id' => $asset3->id,
            'version_number' => 1,
            'file_url' => '/storage/assets/techflow-logo-a.svg',
            'file_path' => 'assets/techflow-logo-a.svg',
            'file_size' => 50000,
            'file_meta' => ['mime_type' => 'image/svg+xml'],
            'uploaded_by' => $creative1->id,
        ]);

        // Set up default settings
        Setting::set('discord_webhook_url', '');

        $this->command->info('Database seeded successfully!');
        $this->command->info('');
        $this->command->info('Demo Accounts:');
        $this->command->info('  Admin: admin@reviewflow.test / password');
        $this->command->info('  PM: pm@reviewflow.test / password');
        $this->command->info('  Creative: designer@reviewflow.test / password');
    }
}
