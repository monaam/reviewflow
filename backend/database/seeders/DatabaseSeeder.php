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
        $rym = User::create([
            'name' => 'Rym',
            'email' => 'rym@le2.agency',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        // Create PM users
        $dounia = User::create([
            'name' => 'Dounia',
            'email' => 'dounia@le2.agency',
            'password' => Hash::make('password'),
            'role' => 'pm',
        ]);

        $neila = User::create([
            'name' => 'Neila',
            'email' => 'neila@le2.agency',
            'password' => Hash::make('password'),
            'role' => 'pm',
        ]);

        // Create Creative/Designer users
        $ihab = User::create([
            'name' => 'Ihab',
            'email' => 'ihab@le2.agency',
            'password' => Hash::make('password'),
            'role' => 'creative',
        ]);

        $ayoub = User::create([
            'name' => 'Ayoub',
            'email' => 'ayoub@le2.agency',
            'password' => Hash::make('password'),
            'role' => 'creative',
        ]);

        $loubna = User::create([
            'name' => 'Loubna',
            'email' => 'loubna@le2.agency',
            'password' => Hash::make('password'),
            'role' => 'creative',
        ]);

        // Create Reviewer users
        $amir = User::create([
            'name' => 'Amir',
            'email' => 'amir@fatoura.app',
            'password' => Hash::make('password'),
            'role' => 'reviewer',
        ]);

        $nadir = User::create([
            'name' => 'Nadir',
            'email' => 'nadir@thetrybe.agency',
            'password' => Hash::make('password'),
            'role' => 'reviewer',
        ]);

        $bouzid = User::create([
            'name' => 'Bouzid',
            'email' => 'bouzid@thetrybe.agency',
            'password' => Hash::make('password'),
            'role' => 'reviewer',
        ]);

        $baki = User::create([
            'name' => 'Baki',
            'email' => 'baki@ideacrafters.com',
            'password' => Hash::make('password'),
            'role' => 'reviewer',
        ]);

        // Create Projects
        $fatoura = Project::create([
            'name' => 'Fatoura',
            'description' => 'Creative assets and branding materials for Fatoura',
            'client_name' => 'Fatoura',
            'deadline' => now()->addDays(30),
            'status' => 'active',
            'created_by' => $dounia->id,
        ]);

        $trybe = Project::create([
            'name' => 'TRYBE',
            'description' => 'Marketing and visual identity for TRYBE',
            'client_name' => 'TRYBE',
            'deadline' => now()->addDays(45),
            'status' => 'active',
            'created_by' => $neila->id,
        ]);

        $ideaCrafters = Project::create([
            'name' => 'IdeaCrafters',
            'description' => 'Brand development and creative campaigns for IdeaCrafters',
            'client_name' => 'IdeaCrafters',
            'deadline' => now()->addDays(60),
            'status' => 'active',
            'created_by' => $dounia->id,
        ]);

        // Add members to Fatoura project
        ProjectMember::create([
            'project_id' => $fatoura->id,
            'user_id' => $dounia->id,
            'role_in_project' => 'owner',
        ]);

        ProjectMember::create([
            'project_id' => $fatoura->id,
            'user_id' => $ihab->id,
            'role_in_project' => 'member',
        ]);

        ProjectMember::create([
            'project_id' => $fatoura->id,
            'user_id' => $ayoub->id,
            'role_in_project' => 'member',
        ]);

        ProjectMember::create([
            'project_id' => $fatoura->id,
            'user_id' => $amir->id,
            'role_in_project' => 'member',
        ]);

        // Add members to TRYBE project
        ProjectMember::create([
            'project_id' => $trybe->id,
            'user_id' => $neila->id,
            'role_in_project' => 'owner',
        ]);

        ProjectMember::create([
            'project_id' => $trybe->id,
            'user_id' => $loubna->id,
            'role_in_project' => 'member',
        ]);

        ProjectMember::create([
            'project_id' => $trybe->id,
            'user_id' => $ihab->id,
            'role_in_project' => 'member',
        ]);

        ProjectMember::create([
            'project_id' => $trybe->id,
            'user_id' => $nadir->id,
            'role_in_project' => 'member',
        ]);

        ProjectMember::create([
            'project_id' => $trybe->id,
            'user_id' => $bouzid->id,
            'role_in_project' => 'member',
        ]);

        // Add members to IdeaCrafters project
        ProjectMember::create([
            'project_id' => $ideaCrafters->id,
            'user_id' => $dounia->id,
            'role_in_project' => 'owner',
        ]);

        ProjectMember::create([
            'project_id' => $ideaCrafters->id,
            'user_id' => $ayoub->id,
            'role_in_project' => 'member',
        ]);

        ProjectMember::create([
            'project_id' => $ideaCrafters->id,
            'user_id' => $loubna->id,
            'role_in_project' => 'member',
        ]);

        ProjectMember::create([
            'project_id' => $ideaCrafters->id,
            'user_id' => $baki->id,
            'role_in_project' => 'member',
        ]);

        // Create Creative Requests for Fatoura
        $request1 = CreativeRequest::create([
            'project_id' => $fatoura->id,
            'title' => 'App Icon Design',
            'description' => 'Design the main app icon for Fatoura mobile application. Should be modern and professional.',
            'created_by' => $dounia->id,
            'assigned_to' => $ihab->id,
            'deadline' => now()->addDays(5),
            'priority' => 'high',
            'status' => 'in_progress',
            'specs' => ['dimensions' => '1024x1024', 'format' => 'PNG'],
        ]);

        $request2 = CreativeRequest::create([
            'project_id' => $fatoura->id,
            'title' => 'Social Media Templates',
            'description' => 'Create a set of social media templates for Instagram and LinkedIn.',
            'created_by' => $dounia->id,
            'assigned_to' => $ayoub->id,
            'deadline' => now()->addDays(7),
            'priority' => 'normal',
            'status' => 'pending',
            'specs' => ['instagram' => '1080x1080', 'linkedin' => '1200x627'],
        ]);

        // Create Creative Requests for TRYBE
        $request3 = CreativeRequest::create([
            'project_id' => $trybe->id,
            'title' => 'Brand Guidelines Document',
            'description' => 'Compile comprehensive brand guidelines including logo usage, colors, and typography.',
            'created_by' => $neila->id,
            'assigned_to' => $loubna->id,
            'deadline' => now()->addDays(10),
            'priority' => 'urgent',
            'status' => 'pending',
        ]);

        $request4 = CreativeRequest::create([
            'project_id' => $trybe->id,
            'title' => 'Website Hero Banner',
            'description' => 'Design an engaging hero banner for the TRYBE website homepage.',
            'created_by' => $neila->id,
            'assigned_to' => $ihab->id,
            'deadline' => now()->addDays(4),
            'priority' => 'high',
            'status' => 'in_progress',
            'specs' => ['dimensions' => '1920x800', 'format' => 'PNG/WebP'],
        ]);

        // Create Creative Requests for IdeaCrafters
        $request5 = CreativeRequest::create([
            'project_id' => $ideaCrafters->id,
            'title' => 'Logo Redesign',
            'description' => 'Modernize the IdeaCrafters logo while maintaining brand recognition.',
            'created_by' => $dounia->id,
            'assigned_to' => $ayoub->id,
            'deadline' => now()->addDays(14),
            'priority' => 'normal',
            'status' => 'pending',
        ]);

        // Create sample assets for Fatoura
        $asset1 = Asset::create([
            'project_id' => $fatoura->id,
            'uploaded_by' => $ihab->id,
            'title' => 'Fatoura App Icon v1',
            'description' => 'Initial concept for the Fatoura app icon',
            'type' => 'image',
            'status' => 'pending_review',
            'current_version' => 1,
        ]);

        AssetVersion::create([
            'asset_id' => $asset1->id,
            'version_number' => 1,
            'file_url' => config('app.url') . '/storage/assets/fatoura-icon-v1.png',
            'file_path' => 'assets/fatoura-icon-v1.png',
            'file_size' => 512000,
            'file_meta' => ['width' => 1024, 'height' => 1024, 'mime_type' => 'image/png'],
            'uploaded_by' => $ihab->id,
        ]);

        // Create sample assets for TRYBE
        $asset2 = Asset::create([
            'project_id' => $trybe->id,
            'uploaded_by' => $ihab->id,
            'title' => 'TRYBE Hero Banner Draft',
            'description' => 'First draft of the website hero banner',
            'type' => 'image',
            'status' => 'revision_requested',
            'current_version' => 2,
        ]);

        AssetVersion::create([
            'asset_id' => $asset2->id,
            'version_number' => 1,
            'file_url' => config('app.url') . '/storage/assets/trybe-banner-v1.png',
            'file_path' => 'assets/trybe-banner-v1.png',
            'file_size' => 2048000,
            'file_meta' => ['width' => 1920, 'height' => 800, 'mime_type' => 'image/png'],
            'uploaded_by' => $ihab->id,
        ]);

        AssetVersion::create([
            'asset_id' => $asset2->id,
            'version_number' => 2,
            'file_url' => config('app.url') . '/storage/assets/trybe-banner-v2.png',
            'file_path' => 'assets/trybe-banner-v2.png',
            'file_size' => 1980000,
            'file_meta' => ['width' => 1920, 'height' => 800, 'mime_type' => 'image/png'],
            'uploaded_by' => $ihab->id,
        ]);

        // Create sample assets for IdeaCrafters
        $asset3 = Asset::create([
            'project_id' => $ideaCrafters->id,
            'uploaded_by' => $ayoub->id,
            'title' => 'IdeaCrafters Logo Concept',
            'description' => 'Modern logo concept for IdeaCrafters rebrand',
            'type' => 'image',
            'status' => 'approved',
            'current_version' => 1,
        ]);

        AssetVersion::create([
            'asset_id' => $asset3->id,
            'version_number' => 1,
            'file_url' => config('app.url') . '/storage/assets/ideacrafters-logo.svg',
            'file_path' => 'assets/ideacrafters-logo.svg',
            'file_size' => 45000,
            'file_meta' => ['mime_type' => 'image/svg+xml'],
            'uploaded_by' => $ayoub->id,
        ]);

        // Set up default settings
        Setting::set('discord_webhook_url', '');

        $this->command->info('Database seeded successfully!');
        $this->command->info('');
        $this->command->info('Le 2 Agency Demo Accounts:');
        $this->command->info('');
        $this->command->info('  Admin:');
        $this->command->info('    Rym: rym@le2.agency / password');
        $this->command->info('');
        $this->command->info('  Project Managers:');
        $this->command->info('    Dounia: dounia@le2.agency / password');
        $this->command->info('    Neila: neila@le2.agency / password');
        $this->command->info('');
        $this->command->info('  Designers:');
        $this->command->info('    Ihab: ihab@le2.agency / password');
        $this->command->info('    Ayoub: ayoub@le2.agency / password');
        $this->command->info('    Loubna: loubna@le2.agency / password');
        $this->command->info('');
        $this->command->info('  Reviewers:');
        $this->command->info('    Amir (Fatoura): amir@fatoura.app / password');
        $this->command->info('    Nadir (TRYBE): nadir@thetrybe.agency / password');
        $this->command->info('    Bouzid (TRYBE): bouzid@thetrybe.agency / password');
        $this->command->info('    Baki (IdeaCrafters): baki@ideacrafters.com / password');
    }
}
