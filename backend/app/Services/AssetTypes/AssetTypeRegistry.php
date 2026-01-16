<?php

namespace App\Services\AssetTypes;

use Illuminate\Http\UploadedFile;

class AssetTypeRegistry
{
    /**
     * @var array<string, AssetTypeHandlerInterface>
     */
    protected array $handlers = [];

    /**
     * @var array<string, AssetTypeHandlerInterface>
     */
    protected array $handlersByPriority = [];

    /**
     * Register a handler with the registry.
     */
    public function register(AssetTypeHandlerInterface $handler): void
    {
        $this->handlers[$handler->getType()] = $handler;
        $this->updatePriorityOrder();
    }

    /**
     * Update the priority order for type detection.
     * More specific handlers should be checked first.
     */
    protected function updatePriorityOrder(): void
    {
        // Sort handlers by specificity (number of MIME patterns)
        // Handlers with specific patterns (like 'application/pdf') are checked before
        // handlers with prefix patterns (like 'image/')
        $this->handlersByPriority = $this->handlers;

        usort($this->handlersByPriority, function ($a, $b) {
            // Handlers with specific MIME types (no trailing /) come first
            $aHasPrefix = $this->hasPatternPrefix($a);
            $bHasPrefix = $this->hasPatternPrefix($b);

            if ($aHasPrefix !== $bHasPrefix) {
                return $aHasPrefix ? 1 : -1;
            }

            return 0;
        });
    }

    /**
     * Check if a handler has prefix patterns.
     */
    protected function hasPatternPrefix(AssetTypeHandlerInterface $handler): bool
    {
        foreach ($handler->getMimePatterns() as $pattern) {
            if (str_ends_with($pattern, '/')) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get a handler by type.
     */
    public function get(string $type): ?AssetTypeHandlerInterface
    {
        return $this->handlers[$type] ?? null;
    }

    /**
     * Get all registered handlers.
     *
     * @return array<string, AssetTypeHandlerInterface>
     */
    public function all(): array
    {
        return $this->handlers;
    }

    /**
     * Get all registered type names.
     *
     * @return string[]
     */
    public function getTypes(): array
    {
        return array_keys($this->handlers);
    }

    /**
     * Determine the asset type for an uploaded file.
     * Returns 'design' as fallback for unknown types.
     */
    public function determineType(UploadedFile $file): string
    {
        // Check handlers in priority order
        foreach ($this->handlersByPriority as $handler) {
            if ($handler->supports($file)) {
                return $handler->getType();
            }
        }

        // Fallback to 'design' for unknown types
        return 'design';
    }

    /**
     * Validate an uploaded file using its detected handler.
     *
     * @return string[] Array of validation errors
     */
    public function validate(UploadedFile $file): array
    {
        $type = $this->determineType($file);
        $handler = $this->get($type);

        if (!$handler) {
            return [];
        }

        return $handler->validate($file);
    }

    /**
     * Extract metadata from an uploaded file using its detected handler.
     */
    public function extractMetadata(UploadedFile $file): array
    {
        $type = $this->determineType($file);
        $handler = $this->get($type);

        if (!$handler) {
            return [
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'extension' => $file->getClientOriginalExtension(),
            ];
        }

        return $handler->extractMetadata($file);
    }

    /**
     * Get the maximum file size for a given type.
     */
    public function getMaxFileSize(string $type): int
    {
        $handler = $this->get($type);

        if (!$handler) {
            return 50 * 1024 * 1024; // Default 50 MB
        }

        return $handler->getMaxFileSize();
    }

    /**
     * Check if a type supports spatial annotations.
     */
    public function supportsSpatialAnnotations(string $type): bool
    {
        $handler = $this->get($type);

        return $handler?->supportsSpatialAnnotations() ?? false;
    }

    /**
     * Check if a type supports temporal annotations.
     */
    public function supportsTemporalAnnotations(string $type): bool
    {
        $handler = $this->get($type);

        return $handler?->supportsTemporalAnnotations() ?? false;
    }

    /**
     * Get all allowed MIME types across all handlers.
     */
    public function getAllAllowedMimeTypes(): array
    {
        $mimes = [];

        foreach ($this->handlers as $handler) {
            $mimes = array_merge($mimes, $handler->getAllowedMimeTypes());
        }

        return array_unique($mimes);
    }

    /**
     * Get handler display name for a type.
     */
    public function getDisplayName(string $type): string
    {
        $handler = $this->get($type);

        return $handler?->getDisplayName() ?? ucfirst($type);
    }
}
