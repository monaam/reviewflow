<?php

namespace App\Services\AssetTypes;

use Illuminate\Http\UploadedFile;
use Smalot\PdfParser\Parser;

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

        try {
            $parser = new Parser();
            $pdf = $parser->parseFile($file->getRealPath());
            $pages = $pdf->getPages();
            $meta['page_count'] = count($pages);
        } catch (\Exception $e) {
            // If parsing fails, default to unknown page count
            $meta['page_count'] = null;
        }

        return $meta;
    }

    /**
     * {@inheritdoc}
     */
    public function supportsSpatialAnnotations(): bool
    {
        return true;
    }

    /**
     * Check if this asset type supports page-based annotations.
     */
    public function supportsPageAnnotations(): bool
    {
        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function getAllowedMimeTypes(): array
    {
        return ['application/pdf'];
    }
}
