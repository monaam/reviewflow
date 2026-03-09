<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PdfPageConversionService
{
    protected string $disk;
    protected int $dpi = 150;
    protected int $maxPages = 200;

    public function __construct()
    {
        $this->disk = config('filesystems.default', 'local');
    }

    /**
     * Convert all pages of a PDF to PNG images.
     *
     * @param string $pdfPath Path to the PDF file in storage
     * @param string $outputDirectory Directory to store the page images
     * @return array Array of page data: [['page_number' => int, 'path' => string, 'width' => int, 'height' => int, 'file_size' => int], ...]
     * @throws \RuntimeException If conversion fails
     */
    public function convertAllPages(string $pdfPath, string $outputDirectory): array
    {
        if (!extension_loaded('imagick')) {
            throw new \RuntimeException('Imagick extension is not available');
        }

        $fullPdfPath = Storage::disk($this->disk)->path($pdfPath);

        if (!file_exists($fullPdfPath)) {
            throw new \RuntimeException("PDF file not found at {$fullPdfPath}");
        }

        // Get page count first
        $pageCount = $this->getPageCount($fullPdfPath);
        if ($pageCount === 0) {
            throw new \RuntimeException('PDF has no pages');
        }

        if ($pageCount > $this->maxPages) {
            throw new \RuntimeException("PDF has {$pageCount} pages, exceeding the maximum of {$this->maxPages}");
        }

        // Ensure output directory exists
        $fullOutputDir = Storage::disk($this->disk)->path($outputDirectory);
        if (!is_dir($fullOutputDir)) {
            mkdir($fullOutputDir, 0755, true);
        }

        $pages = [];

        for ($i = 0; $i < $pageCount; $i++) {
            $pageData = $this->convertSinglePage($fullPdfPath, $outputDirectory, $i);
            if ($pageData) {
                $pages[] = $pageData;
            }
        }

        return $pages;
    }

    /**
     * Convert a single page of a PDF to a PNG image.
     */
    protected function convertSinglePage(string $fullPdfPath, string $outputDirectory, int $pageIndex): ?array
    {
        $imagick = null;
        try {
            $imagick = new \Imagick();
            $imagick->setResolution($this->dpi, $this->dpi);
            $imagick->readImage($fullPdfPath . "[{$pageIndex}]");
            $imagick->setImageAlphaChannel(\Imagick::ALPHACHANNEL_REMOVE);
            $imagick->setImageBackgroundColor('white');
            $imagick->mergeImageLayers(\Imagick::LAYERMETHOD_FLATTEN);
            $imagick->setImageFormat('jpeg');
            $imagick->setImageCompressionQuality(85);

            $geometry = $imagick->getImageGeometry();

            $filename = 'page-' . ($pageIndex + 1) . '-' . Str::uuid() . '.jpg';
            $imagePath = $outputDirectory . '/' . $filename;
            $fullImagePath = Storage::disk($this->disk)->path($imagePath);

            $imagick->writeImage($fullImagePath);

            $fileSize = filesize($fullImagePath);

            $imagick->clear();
            $imagick->destroy();

            return [
                'page_number' => $pageIndex + 1,
                'path' => $imagePath,
                'width' => $geometry['width'],
                'height' => $geometry['height'],
                'file_size' => $fileSize,
            ];
        } catch (\Exception $e) {
            if ($imagick) {
                $imagick->clear();
                $imagick->destroy();
            }

            Log::warning("PdfPageConversionService: Failed to convert page {$pageIndex}", [
                'error' => $e->getMessage(),
                'pdf_path' => $fullPdfPath,
            ]);

            return null;
        }
    }

    /**
     * Get the number of pages in a PDF.
     */
    protected function getPageCount(string $fullPdfPath): int
    {
        try {
            $imagick = new \Imagick();
            $imagick->pingImage($fullPdfPath);
            $count = $imagick->getNumberImages();
            $imagick->clear();
            $imagick->destroy();
            return $count;
        } catch (\Exception $e) {
            Log::warning("PdfPageConversionService: Failed to get page count", [
                'error' => $e->getMessage(),
            ]);
            return 0;
        }
    }

    /**
     * Delete all page images for a given directory pattern.
     */
    public function deletePages(array $imagePaths): void
    {
        foreach ($imagePaths as $path) {
            if (Storage::disk($this->disk)->exists($path)) {
                Storage::disk($this->disk)->delete($path);
            }
        }
    }
}
