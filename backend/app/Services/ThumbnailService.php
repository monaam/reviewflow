<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ThumbnailService
{
    protected string $disk;
    protected int $thumbnailWidth = 480;
    protected int $thumbnailHeight = 270; // 16:9 aspect ratio

    public function __construct()
    {
        $this->disk = config('filesystems.default', 'local');
    }

    /**
     * Generate a thumbnail for a video file.
     *
     * @param string $videoPath Path to the video file in storage
     * @param string $directory Directory to store the thumbnail
     * @return array|null Returns ['path' => ..., 'url' => ...] or null on failure
     */
    public function generateVideoThumbnail(string $videoPath, string $directory): ?array
    {
        $fullVideoPath = Storage::disk($this->disk)->path($videoPath);

        if (!file_exists($fullVideoPath)) {
            Log::warning("ThumbnailService: Video file not found at {$fullVideoPath}");
            return null;
        }

        // Check if FFmpeg is available
        $ffmpegPath = $this->getFfmpegPath();
        if (!$ffmpegPath) {
            Log::warning('ThumbnailService: FFmpeg not available');
            return null;
        }

        $thumbnailFilename = 'thumb-' . Str::uuid() . '.jpg';
        $thumbnailPath = $directory . '/' . $thumbnailFilename;
        $fullThumbnailPath = Storage::disk($this->disk)->path($thumbnailPath);

        // Ensure directory exists
        $thumbnailDir = dirname($fullThumbnailPath);
        if (!is_dir($thumbnailDir)) {
            mkdir($thumbnailDir, 0755, true);
        }

        // Extract frame at 1 second, scale to cover and center-crop to fill thumbnail
        // This handles both landscape (16:9) and portrait (9:16) videos nicely
        $command = sprintf(
            '%s -i %s -ss 00:00:01 -vframes 1 -vf "scale=%d:%d:force_original_aspect_ratio=increase,crop=%d:%d" -y %s 2>&1',
            escapeshellarg($ffmpegPath),
            escapeshellarg($fullVideoPath),
            $this->thumbnailWidth,
            $this->thumbnailHeight,
            $this->thumbnailWidth,
            $this->thumbnailHeight,
            escapeshellarg($fullThumbnailPath)
        );

        exec($command, $output, $returnCode);

        if ($returnCode !== 0 || !file_exists($fullThumbnailPath)) {
            Log::warning("ThumbnailService: FFmpeg failed to generate video thumbnail", [
                'command' => $command,
                'output' => implode("\n", $output),
                'return_code' => $returnCode,
            ]);
            return null;
        }

        return [
            'path' => $thumbnailPath,
            'url' => $this->getUrl($thumbnailPath),
        ];
    }

    /**
     * Generate a thumbnail for a PDF file.
     *
     * @param string $pdfPath Path to the PDF file in storage
     * @param string $directory Directory to store the thumbnail
     * @return array|null Returns ['path' => ..., 'url' => ...] or null on failure
     */
    public function generatePdfThumbnail(string $pdfPath, string $directory): ?array
    {
        $fullPdfPath = Storage::disk($this->disk)->path($pdfPath);

        if (!file_exists($fullPdfPath)) {
            Log::warning("ThumbnailService: PDF file not found at {$fullPdfPath}");
            return null;
        }

        // Check if Imagick is available
        if (!extension_loaded('imagick')) {
            Log::warning('ThumbnailService: Imagick extension not available');
            return null;
        }

        $thumbnailFilename = 'thumb-' . Str::uuid() . '.jpg';
        $thumbnailPath = $directory . '/' . $thumbnailFilename;
        $fullThumbnailPath = Storage::disk($this->disk)->path($thumbnailPath);

        // Ensure directory exists
        $thumbnailDir = dirname($fullThumbnailPath);
        if (!is_dir($thumbnailDir)) {
            mkdir($thumbnailDir, 0755, true);
        }

        try {
            $imagick = new \Imagick();
            $imagick->setResolution(150, 150);
            // Read only the first page [0]
            $imagick->readImage($fullPdfPath . '[0]');
            $imagick->setImageFormat('jpeg');
            $imagick->setImageCompressionQuality(85);

            // Scale to cover thumbnail dimensions (like CSS object-fit: cover)
            $geometry = $imagick->getImageGeometry();
            $srcRatio = $geometry['width'] / $geometry['height'];
            $targetRatio = $this->thumbnailWidth / $this->thumbnailHeight;

            if ($srcRatio > $targetRatio) {
                // Source is wider - scale by height, crop width
                $newHeight = $this->thumbnailHeight;
                $newWidth = (int)($geometry['width'] * ($this->thumbnailHeight / $geometry['height']));
            } else {
                // Source is taller - scale by width, crop height
                $newWidth = $this->thumbnailWidth;
                $newHeight = (int)($geometry['height'] * ($this->thumbnailWidth / $geometry['width']));
            }

            $imagick->resizeImage($newWidth, $newHeight, \Imagick::FILTER_LANCZOS, 1);

            // Crop to exact dimensions (from top for PDFs to show document header)
            $cropX = (int)(($newWidth - $this->thumbnailWidth) / 2);
            $cropY = 0; // Start from top to show document header
            $imagick->cropImage($this->thumbnailWidth, $this->thumbnailHeight, $cropX, $cropY);
            $imagick->setImagePage(0, 0, 0, 0); // Reset virtual canvas

            $imagick->writeImage($fullThumbnailPath);
            $imagick->destroy();

            return [
                'path' => $thumbnailPath,
                'url' => $this->getUrl($thumbnailPath),
            ];
        } catch (\Exception $e) {
            Log::warning("ThumbnailService: Failed to generate PDF thumbnail", [
                'error' => $e->getMessage(),
                'pdf_path' => $fullPdfPath,
            ]);
            return null;
        }
    }

    /**
     * Generate a thumbnail based on asset type.
     *
     * @param string $filePath Path to the file in storage
     * @param string $type Asset type (video, pdf)
     * @param string $directory Directory to store the thumbnail
     * @return array|null Returns ['path' => ..., 'url' => ...] or null on failure
     */
    public function generateThumbnail(string $filePath, string $type, string $directory): ?array
    {
        return match ($type) {
            'video' => $this->generateVideoThumbnail($filePath, $directory),
            'pdf' => $this->generatePdfThumbnail($filePath, $directory),
            default => null,
        };
    }

    /**
     * Delete a thumbnail file.
     */
    public function delete(string $thumbnailPath): bool
    {
        if (Storage::disk($this->disk)->exists($thumbnailPath)) {
            return Storage::disk($this->disk)->delete($thumbnailPath);
        }
        return false;
    }

    /**
     * Get the URL for a thumbnail path.
     */
    protected function getUrl(string $path): string
    {
        if ($this->disk === 's3' || $this->disk === 'spaces' || $this->disk === 'r2') {
            return Storage::disk($this->disk)->temporaryUrl($path, now()->addHours(24));
        }

        if ($this->disk === 'public') {
            // Public disk uses /storage symlink
            return rtrim(config('app.url'), '/') . '/storage/' . $path;
        }

        // Local disk uses the stream route
        return rtrim(config('app.url'), '/') . '/api/stream/' . $path;
    }

    /**
     * Get the path to FFmpeg binary.
     */
    protected function getFfmpegPath(): ?string
    {
        // Check common paths
        $paths = [
            '/usr/bin/ffmpeg',
            '/usr/local/bin/ffmpeg',
            'ffmpeg', // System PATH
        ];

        foreach ($paths as $path) {
            $output = [];
            $returnCode = 0;
            exec(escapeshellarg($path) . ' -version 2>&1', $output, $returnCode);

            if ($returnCode === 0) {
                return $path;
            }
        }

        return null;
    }
}
