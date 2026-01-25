<?php

namespace App\Jobs;

use App\Models\AssetVersion;
use App\Services\ThumbnailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateThumbnailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public int $backoff = 30;

    /**
     * Create a new job instance.
     */
    public function __construct(
        protected string $assetVersionId,
        protected string $assetType,
        protected string $filePath,
        protected string $projectId
    ) {}

    /**
     * Execute the job.
     */
    public function handle(ThumbnailService $thumbnailService): void
    {
        $assetVersion = AssetVersion::find($this->assetVersionId);

        if (!$assetVersion) {
            Log::warning("GenerateThumbnailJob: AssetVersion not found", [
                'asset_version_id' => $this->assetVersionId,
            ]);
            return;
        }

        // Skip if thumbnail already exists
        if ($assetVersion->thumbnail_url) {
            Log::info("GenerateThumbnailJob: Thumbnail already exists, skipping", [
                'asset_version_id' => $this->assetVersionId,
            ]);
            return;
        }

        $thumbnailData = $thumbnailService->generateThumbnail(
            $this->filePath,
            $this->assetType,
            "assets/{$this->projectId}/thumbnails"
        );

        if ($thumbnailData) {
            $assetVersion->update([
                'thumbnail_url' => $thumbnailData['url'],
                'thumbnail_path' => $thumbnailData['path'],
            ]);

            Log::info("GenerateThumbnailJob: Thumbnail generated successfully", [
                'asset_version_id' => $this->assetVersionId,
                'thumbnail_url' => $thumbnailData['url'],
            ]);
        } else {
            Log::warning("GenerateThumbnailJob: Failed to generate thumbnail", [
                'asset_version_id' => $this->assetVersionId,
                'asset_type' => $this->assetType,
            ]);
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("GenerateThumbnailJob: Job failed", [
            'asset_version_id' => $this->assetVersionId,
            'error' => $exception->getMessage(),
        ]);
    }
}
