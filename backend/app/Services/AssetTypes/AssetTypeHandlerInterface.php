<?php

namespace App\Services\AssetTypes;

use Illuminate\Http\UploadedFile;

interface AssetTypeHandlerInterface
{
    /**
     * Get the unique type identifier (e.g., 'image', 'video').
     */
    public function getType(): string;

    /**
     * Get the human-readable display name.
     */
    public function getDisplayName(): string;

    /**
     * Get the MIME type patterns this handler supports.
     * Can use prefix matching (e.g., 'image/' matches all image types).
     */
    public function getMimePatterns(): array;

    /**
     * Get supported file extensions.
     */
    public function getExtensions(): array;

    /**
     * Check if this handler supports the given file.
     */
    public function supports(UploadedFile $file): bool;

    /**
     * Get the maximum file size in bytes.
     */
    public function getMaxFileSize(): int;

    /**
     * Extract metadata from the uploaded file.
     */
    public function extractMetadata(UploadedFile $file): array;

    /**
     * Validate the uploaded file.
     * Returns an array of validation errors, or empty array if valid.
     */
    public function validate(UploadedFile $file): array;

    /**
     * Whether this type supports spatial (position-based) annotations.
     */
    public function supportsSpatialAnnotations(): bool;

    /**
     * Whether this type supports temporal (time-based) annotations.
     */
    public function supportsTemporalAnnotations(): bool;

    /**
     * Get allowed MIME types for file validation.
     */
    public function getAllowedMimeTypes(): array;
}
