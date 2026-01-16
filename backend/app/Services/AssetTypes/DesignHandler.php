<?php

namespace App\Services\AssetTypes;

use Illuminate\Http\UploadedFile;

class DesignHandler extends BaseAssetTypeHandler
{
    protected int $maxFileSize = 100 * 1024 * 1024; // 100 MB

    /**
     * {@inheritdoc}
     */
    public function getType(): string
    {
        return 'design';
    }

    /**
     * {@inheritdoc}
     */
    public function getDisplayName(): string
    {
        return 'Design File';
    }

    /**
     * {@inheritdoc}
     */
    public function getMimePatterns(): array
    {
        return [
            'application/postscript',       // .ai, .eps
            'application/illustrator',      // .ai
            'application/x-photoshop',      // .psd
            'image/vnd.adobe.photoshop',    // .psd
            'application/x-indesign',       // .indd
            'application/sketch',           // .sketch
            'application/figma',            // Figma files
            'application/octet-stream',     // Generic binary (fallback for design files)
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function getExtensions(): array
    {
        return ['ai', 'psd', 'eps', 'indd', 'sketch', 'fig', 'xd'];
    }

    /**
     * {@inheritdoc}
     */
    public function extractMetadata(UploadedFile $file): array
    {
        $meta = parent::extractMetadata($file);

        // Design files typically require specialized tools to extract metadata.
        // Mark as design file for special handling.
        $meta['is_design_file'] = true;

        return $meta;
    }

    /**
     * {@inheritdoc}
     */
    public function supportsSpatialAnnotations(): bool
    {
        // Design files could support annotations if we have preview rendering
        return false;
    }

    /**
     * {@inheritdoc}
     */
    public function getAllowedMimeTypes(): array
    {
        // Design files often come as application/octet-stream
        // So we primarily rely on extension checking
        return [];
    }

    /**
     * {@inheritdoc}
     */
    public function supports(UploadedFile $file): bool
    {
        // For design files, prioritize extension checking since MIME types
        // are often unreliable for proprietary formats
        $extension = strtolower($file->getClientOriginalExtension());

        return in_array($extension, $this->getExtensions(), true);
    }
}
