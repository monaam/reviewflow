<?php

namespace App\Jobs;

use App\Models\AssetVersion;
use App\Models\PdfPage;
use App\Services\PdfPageConversionService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ConvertPdfPagesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;
    public int $timeout = 300;

    public function __construct(
        protected string $assetVersionId,
        protected string $filePath,
        protected string $projectId
    ) {
        $this->onQueue('thumbnails');
    }

    public function handle(PdfPageConversionService $conversionService): void
    {
        $assetVersion = AssetVersion::find($this->assetVersionId);

        if (!$assetVersion) {
            Log::warning("ConvertPdfPagesJob: AssetVersion not found", [
                'asset_version_id' => $this->assetVersionId,
            ]);
            return;
        }

        // Skip if already completed
        if ($assetVersion->pdf_pages_status === 'completed') {
            return;
        }

        $assetVersion->update(['pdf_pages_status' => 'processing']);

        try {
            $outputDirectory = "assets/{$this->projectId}/pdf-pages/{$this->assetVersionId}";

            $pages = $conversionService->convertAllPages($this->filePath, $outputDirectory);

            DB::transaction(function () use ($assetVersion, $pages) {
                foreach ($pages as $page) {
                    PdfPage::create([
                        'asset_version_id' => $assetVersion->id,
                        'page_number' => $page['page_number'],
                        'image_path' => $page['path'],
                        'width' => $page['width'],
                        'height' => $page['height'],
                        'file_size' => $page['file_size'],
                    ]);
                }

                $assetVersion->update(['pdf_pages_status' => 'completed']);
            });

            Log::info("ConvertPdfPagesJob: Successfully converted PDF pages", [
                'asset_version_id' => $this->assetVersionId,
                'page_count' => count($pages),
            ]);
        } catch (\Exception $e) {
            $assetVersion->update(['pdf_pages_status' => 'failed']);

            Log::error("ConvertPdfPagesJob: Failed to convert PDF pages", [
                'asset_version_id' => $this->assetVersionId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function failed(\Throwable $exception): void
    {
        $assetVersion = AssetVersion::find($this->assetVersionId);
        $assetVersion?->update(['pdf_pages_status' => 'failed']);

        Log::error("ConvertPdfPagesJob: Job failed permanently", [
            'asset_version_id' => $this->assetVersionId,
            'error' => $exception->getMessage(),
        ]);
    }
}
