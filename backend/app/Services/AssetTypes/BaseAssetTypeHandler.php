<?php

namespace App\Services\AssetTypes;

use Illuminate\Http\UploadedFile;

abstract class BaseAssetTypeHandler implements AssetTypeHandlerInterface
{
    /**
     * Default max file size: 50 MB.
     */
    protected int $maxFileSize = 50 * 1024 * 1024;

    /**
     * {@inheritdoc}
     */
    public function supports(UploadedFile $file): bool
    {
        $mime = $file->getMimeType();
        $extension = strtolower($file->getClientOriginalExtension());

        // Check MIME patterns
        foreach ($this->getMimePatterns() as $pattern) {
            if (str_ends_with($pattern, '/')) {
                // Prefix pattern (e.g., 'image/')
                if (str_starts_with($mime, $pattern)) {
                    return true;
                }
            } elseif ($mime === $pattern) {
                return true;
            }
        }

        // Check extensions
        if (in_array($extension, $this->getExtensions(), true)) {
            return true;
        }

        return false;
    }

    /**
     * {@inheritdoc}
     */
    public function getMaxFileSize(): int
    {
        return $this->maxFileSize;
    }

    /**
     * {@inheritdoc}
     */
    public function extractMetadata(UploadedFile $file): array
    {
        return [
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'extension' => $file->getClientOriginalExtension(),
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function validate(UploadedFile $file): array
    {
        $errors = [];

        // Validate file size
        if ($file->getSize() > $this->getMaxFileSize()) {
            $maxMB = round($this->getMaxFileSize() / 1024 / 1024, 1);
            $errors[] = "File size exceeds maximum allowed size of {$maxMB} MB.";
        }

        // Validate MIME type
        $allowedMimes = $this->getAllowedMimeTypes();
        if (!empty($allowedMimes) && !in_array($file->getMimeType(), $allowedMimes, true)) {
            $errors[] = 'File type is not allowed for this asset type.';
        }

        return $errors;
    }

    /**
     * {@inheritdoc}
     */
    public function supportsSpatialAnnotations(): bool
    {
        return false;
    }

    /**
     * {@inheritdoc}
     */
    public function supportsTemporalAnnotations(): bool
    {
        return false;
    }

    /**
     * {@inheritdoc}
     */
    public function getAllowedMimeTypes(): array
    {
        $mimes = [];

        foreach ($this->getMimePatterns() as $pattern) {
            if (str_ends_with($pattern, '/')) {
                // For prefix patterns, we need to expand to specific types
                // This is handled by subclasses
                continue;
            }
            $mimes[] = $pattern;
        }

        return $mimes;
    }
}
