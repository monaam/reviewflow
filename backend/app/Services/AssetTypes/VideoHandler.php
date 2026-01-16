<?php

namespace App\Services\AssetTypes;

use Illuminate\Http\UploadedFile;

class VideoHandler extends BaseAssetTypeHandler
{
    protected int $maxFileSize = 500 * 1024 * 1024; // 500 MB

    /**
     * {@inheritdoc}
     */
    public function getType(): string
    {
        return 'video';
    }

    /**
     * {@inheritdoc}
     */
    public function getDisplayName(): string
    {
        return 'Video';
    }

    /**
     * {@inheritdoc}
     */
    public function getMimePatterns(): array
    {
        return ['video/'];
    }

    /**
     * {@inheritdoc}
     */
    public function getExtensions(): array
    {
        return ['mp4', 'mov', 'webm', 'avi', 'mkv', 'wmv', 'm4v'];
    }

    /**
     * {@inheritdoc}
     */
    public function extractMetadata(UploadedFile $file): array
    {
        $meta = parent::extractMetadata($file);

        // Note: Full video metadata extraction (duration, resolution) would require
        // FFmpeg or similar tools. For now, we store basic metadata.
        // This can be extended later with FFmpeg integration.

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
     * {@inheritdoc}
     */
    public function supportsTemporalAnnotations(): bool
    {
        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function getAllowedMimeTypes(): array
    {
        return [
            'video/mp4',
            'video/quicktime',
            'video/webm',
            'video/x-msvideo',
            'video/x-matroska',
            'video/x-ms-wmv',
        ];
    }
}
