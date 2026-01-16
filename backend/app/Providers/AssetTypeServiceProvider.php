<?php

namespace App\Providers;

use App\Services\AssetTypes\AssetTypeRegistry;
use App\Services\AssetTypes\DesignHandler;
use App\Services\AssetTypes\ImageHandler;
use App\Services\AssetTypes\PdfHandler;
use App\Services\AssetTypes\VideoHandler;
use Illuminate\Support\ServiceProvider;

class AssetTypeServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(AssetTypeRegistry::class, function ($app) {
            $registry = new AssetTypeRegistry();

            // Register default handlers
            $registry->register(new ImageHandler());
            $registry->register(new VideoHandler());
            $registry->register(new PdfHandler());
            $registry->register(new DesignHandler());

            return $registry;
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
