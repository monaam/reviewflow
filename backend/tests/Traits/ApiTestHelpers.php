<?php

namespace Tests\Traits;

use App\Models\Asset;
use App\Models\AssetVersion;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;

trait ApiTestHelpers
{
    protected User $admin;
    protected User $pm;
    protected User $creative;
    protected User $reviewer;

    protected function setUpUsers(): void
    {
        $this->admin = User::factory()->admin()->create();
        $this->pm = User::factory()->pm()->create();
        $this->creative = User::factory()->creative()->create();
        $this->reviewer = User::factory()->reviewer()->create();
    }

    protected function actingAsAdmin(): self
    {
        Sanctum::actingAs($this->admin);
        return $this;
    }

    protected function actingAsPM(): self
    {
        Sanctum::actingAs($this->pm);
        return $this;
    }

    protected function actingAsCreative(): self
    {
        Sanctum::actingAs($this->creative);
        return $this;
    }

    protected function actingAsReviewer(): self
    {
        Sanctum::actingAs($this->reviewer);
        return $this;
    }

    protected function actingAsUser(User $user): self
    {
        Sanctum::actingAs($user);
        return $this;
    }

    protected function createProjectWithMembers(User $owner, array $members = []): Project
    {
        $project = Project::factory()->create(['created_by' => $owner->id]);

        ProjectMember::factory()->owner()->create([
            'project_id' => $project->id,
            'user_id' => $owner->id,
        ]);

        foreach ($members as $member) {
            ProjectMember::factory()->create([
                'project_id' => $project->id,
                'user_id' => $member->id,
            ]);
        }

        return $project;
    }

    protected function createAssetWithVersion(Project $project, User $uploader): Asset
    {
        $asset = Asset::factory()->create([
            'project_id' => $project->id,
            'uploaded_by' => $uploader->id,
        ]);

        AssetVersion::factory()->create([
            'asset_id' => $asset->id,
            'version_number' => 1,
            'uploaded_by' => $uploader->id,
        ]);

        return $asset;
    }

    protected function createTestFile(string $type = 'image'): UploadedFile
    {
        return match ($type) {
            'image' => UploadedFile::fake()->image('test.jpg', 1920, 1080)->size(1024),
            'video' => UploadedFile::fake()->create('test.mp4', 5120, 'video/mp4'),
            'pdf' => UploadedFile::fake()->create('test.pdf', 512, 'application/pdf'),
            default => UploadedFile::fake()->create('test.psd', 2048, 'application/octet-stream'),
        };
    }
}
