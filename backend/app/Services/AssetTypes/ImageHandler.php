<?php

namespace App\Services\AssetTypes;

use Illuminate\Http\UploadedFile;

class ImageHandler extends BaseAssetTypeHandler
{
    protected int $maxFileSize = 50 * 1024 * 1024; // 50 MB

    /**
     * {@inheritdoc}
     */
    public function getType(): string
    {
        return 'image';
    }

    /**
     * {@inheritdoc}
     */
    public function getDisplayName(): string
    {
        return 'Image';
    }

    /**
     * {@inheritdoc}
     */
    public function getMimePatterns(): array
    {
        return ['image/'];
    }

    /**
     * {@inheritdoc}
     */
    public function getExtensions(): array
    {
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'];
    }

    /**
     * {@inheritdoc}
     */
    public function extractMetadata(UploadedFile $file): array
    {
        $meta = parent::extractMetadata($file);

        // Extract image dimensions
        $imageInfo = @getimagesize($file->getRealPath());
        if ($imageInfo) {
            $meta['width'] = $imageInfo[0];
            $meta['height'] = $imageInfo[1];
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
     * {@inheritdoc}
     */
    public function getAllowedMimeTypes(): array
    {
        return [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            'image/bmp',
            'image/tiff',
        ];
    }
}
