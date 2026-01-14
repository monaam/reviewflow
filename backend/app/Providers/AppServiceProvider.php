<?php

namespace App\Providers;

use App\Models\Asset;
use App\Models\Comment;
use App\Models\CreativeRequest;
use App\Models\Project;
use App\Policies\AssetPolicy;
use App\Policies\CommentPolicy;
use App\Policies\CreativeRequestPolicy;
use App\Policies\ProjectPolicy;
use App\Services\DiscordNotificationService;
use App\Services\FileUploadService;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(FileUploadService::class);
        $this->app->singleton(DiscordNotificationService::class);
    }

    public function boot(): void
    {
        Gate::policy(Project::class, ProjectPolicy::class);
        Gate::policy(Asset::class, AssetPolicy::class);
        Gate::policy(Comment::class, CommentPolicy::class);
        Gate::policy(CreativeRequest::class, CreativeRequestPolicy::class);
    }
}
