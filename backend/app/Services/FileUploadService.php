<?php

namespace App\Services;

use App\Services\AssetTypes\AssetTypeRegistry;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileUploadService
{
    protected string $disk;

    public function __construct(
        protected ?AssetTypeRegistry $assetTypeRegistry = null
    ) {
        $this->disk = config('filesystems.default', 'local');
    }

    public function upload(UploadedFile $file, string $directory = 'uploads'): array
    {
        $filename = $this->generateFilename($file);
        $path = $file->storeAs($directory, $filename, $this->disk);

        return [
            'path' => $path,
            'url' => $this->getUrl($path),
            'filename' => $filename,
        ];
    }

    public function delete(string $path): bool
    {
        if (Storage::disk($this->disk)->exists($path)) {
            return Storage::disk($this->disk)->delete($path);
        }

        return false;
    }

    public function getUrl(string $path): string
    {
        if ($this->disk === 's3' || $this->disk === 'spaces' || $this->disk === 'r2') {
            return Storage::disk($this->disk)->temporaryUrl($path, now()->addHours(24));
        }

        // Return full URL for local storage
        $url = Storage::disk($this->disk)->url($path);
        if (!str_starts_with($url, 'http')) {
            $url = rtrim(config('app.url'), '/') . $url;
        }

        return $url;
    }

    public function exists(string $path): bool
    {
        return Storage::disk($this->disk)->exists($path);
    }

    public function getSize(string $path): int
    {
        return Storage::disk($this->disk)->size($path);
    }

    protected function generateFilename(UploadedFile $file): string
    {
        $extension = $file->getClientOriginalExtension();
        $name = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $slug = Str::slug($name);
        $uuid = Str::uuid();

        return "{$slug}-{$uuid}.{$extension}";
    }

    public function getAllowedMimeTypes(): array
    {
        // Use registry if available, otherwise return default list
        if ($this->assetTypeRegistry) {
            return $this->assetTypeRegistry->getAllAllowedMimeTypes();
        }

        // Fallback list for when registry is not available
        return [
            // Images
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            // Videos
            'video/mp4',
            'video/quicktime',
            'video/webm',
            // Documents
            'application/pdf',
        ];
    }

    public function getMaxFileSize(string $type): int
    {
        // Use registry if available
        if ($this->assetTypeRegistry) {
            return $this->assetTypeRegistry->getMaxFileSize($type);
        }

        // Fallback for when registry is not available
        return match ($type) {
            'image' => 50 * 1024 * 1024, // 50 MB
            'video' => 500 * 1024 * 1024, // 500 MB
            'pdf' => 50 * 1024 * 1024, // 50 MB
            'design' => 100 * 1024 * 1024, // 100 MB
            default => 50 * 1024 * 1024,
        };
    }
}
