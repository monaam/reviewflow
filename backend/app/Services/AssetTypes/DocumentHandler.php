<?php

namespace App\Services\AssetTypes;

use App\Services\HtmlSanitizer;
use Illuminate\Http\UploadedFile;

class DocumentHandler extends BaseAssetTypeHandler
{
    public function getType(): string
    {
        return 'document';
    }

    public function getDisplayName(): string
    {
        return 'Document';
    }

    public function getMimePatterns(): array
    {
        return [];
    }

    public function getExtensions(): array
    {
        return [];
    }

    /**
     * Documents are never auto-detected from file uploads.
     */
    public function supports(UploadedFile $file): bool
    {
        return false;
    }

    public function supportsSpatialAnnotations(): bool
    {
        return false;
    }

    public function supportsTemporalAnnotations(): bool
    {
        return false;
    }

    public function supportsTextAnnotations(): bool
    {
        return true;
    }

    public function getAllowedMimeTypes(): array
    {
        return [];
    }

    /**
     * Sanitize HTML content and return sanitized HTML + word count.
     *
     * @return array{content: string, word_count: int}
     */
    public function sanitizeContent(string $html): array
    {
        $sanitized = HtmlSanitizer::sanitize($html);
        $wordCount = HtmlSanitizer::wordCount($sanitized);

        return [
            'content' => $sanitized,
            'word_count' => $wordCount,
        ];
    }
}
