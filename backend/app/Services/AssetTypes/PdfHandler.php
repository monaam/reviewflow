<?php

namespace App\Services\AssetTypes;

use Illuminate\Http\UploadedFile;

class PdfHandler extends BaseAssetTypeHandler
{
    protected int $maxFileSize = 50 * 1024 * 1024; // 50 MB

    /**
     * {@inheritdoc}
     */
    public function getType(): string
    {
        return 'pdf';
    }

    /**
     * {@inheritdoc}
     */
    public function getDisplayName(): string
    {
        return 'PDF Document';
    }

    /**
     * {@inheritdoc}
     */
    public function getMimePatterns(): array
    {
        return ['application/pdf'];
    }

    /**
     * {@inheritdoc}
     */
    public function getExtensions(): array
    {
        return ['pdf'];
    }

    /**
     * {@inheritdoc}
     */
    public function extractMetadata(UploadedFile $file): array
    {
        $meta = parent::extractMetadata($file);

        // Note: PDF metadata extraction (page count, etc.) would require
        // a PDF parsing library. This can be extended later.

        return $meta;
    }

    /**
     * {@inheritdoc}
     */
    public function supportsSpatialAnnotations(): bool
    {
        // PDFs could support annotations per-page in the future
        return false;
    }

    /**
     * {@inheritdoc}
     */
    public function getAllowedMimeTypes(): array
    {
        return ['application/pdf'];
    }
}
