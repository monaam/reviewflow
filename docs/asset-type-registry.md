# Asset Type Registry Architecture

This document describes the registry-based architecture for handling different asset types in ReviewFlow. This architecture enables easy extensibility - adding new asset types (e.g., audio, 3D models) requires minimal code changes.

## Overview

The asset type system uses a **plugin-style registry pattern** where each asset type is handled by a dedicated handler class (backend) and configuration entry (frontend). Core review logic remains type-agnostic and delegates type-specific behavior to the registry.

### Benefits

- **Single point of registration**: Add a new type in one place per layer
- **Zero core logic changes**: Review, annotation, and comparison features work automatically
- **Type-safe**: Full TypeScript support on frontend, PHP interfaces on backend
- **Consistent behavior**: All types follow the same patterns

## Backend Architecture

### Directory Structure

```
backend/app/Services/AssetTypes/
├── AssetTypeHandlerInterface.php   # Contract for all handlers
├── BaseAssetTypeHandler.php        # Default implementations
├── AssetTypeRegistry.php           # Central registry service
├── ImageHandler.php                # Image type handler
├── VideoHandler.php                # Video type handler
├── PdfHandler.php                  # PDF type handler
└── DesignHandler.php               # Design file handler (fallback)
```

### AssetTypeHandlerInterface

Every asset type handler must implement this interface:

```php
interface AssetTypeHandlerInterface
{
    public function getType(): string;              // e.g., 'image', 'video'
    public function getDisplayName(): string;       // e.g., 'Image', 'Video'
    public function getMimePatterns(): array;       // e.g., ['image/'], ['video/mp4']
    public function getExtensions(): array;         // e.g., ['jpg', 'png']
    public function supports(UploadedFile $file): bool;
    public function getMaxFileSize(): int;          // in bytes
    public function extractMetadata(UploadedFile $file): array;
    public function validate(UploadedFile $file): array;
    public function supportsSpatialAnnotations(): bool;
    public function supportsTemporalAnnotations(): bool;
    public function getAllowedMimeTypes(): array;
}
```

### BaseAssetTypeHandler

Provides sensible defaults that handlers can override:

```php
abstract class BaseAssetTypeHandler implements AssetTypeHandlerInterface
{
    protected int $maxFileSize = 50 * 1024 * 1024; // 50 MB default

    public function supports(UploadedFile $file): bool
    {
        // Checks MIME patterns and extensions
    }

    public function extractMetadata(UploadedFile $file): array
    {
        // Returns basic metadata (name, mime, extension)
    }

    public function validate(UploadedFile $file): array
    {
        // Validates file size and MIME type
    }

    public function supportsSpatialAnnotations(): bool
    {
        return false; // Override in subclass
    }

    public function supportsTemporalAnnotations(): bool
    {
        return false; // Override in subclass
    }
}
```

### AssetTypeRegistry

Central service for type operations:

```php
class AssetTypeRegistry
{
    public function register(AssetTypeHandlerInterface $handler): void;
    public function get(string $type): ?AssetTypeHandlerInterface;
    public function determineType(UploadedFile $file): string;
    public function validate(UploadedFile $file): array;
    public function extractMetadata(UploadedFile $file): array;
    public function getMaxFileSize(string $type): int;
    public function supportsSpatialAnnotations(string $type): bool;
    public function supportsTemporalAnnotations(string $type): bool;
}
```

### Handler Registration

Handlers are registered in `AssetTypeServiceProvider`:

```php
class AssetTypeServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(AssetTypeRegistry::class, function ($app) {
            $registry = new AssetTypeRegistry();

            $registry->register(new ImageHandler());
            $registry->register(new VideoHandler());
            $registry->register(new PdfHandler());
            $registry->register(new DesignHandler());

            return $registry;
        });
    }
}
```

### Usage in Controllers

```php
class AssetController extends Controller
{
    public function __construct(
        protected AssetTypeRegistry $assetTypeRegistry
    ) {}

    public function store(Request $request, Project $project)
    {
        $file = $request->file('file');

        // Determine type automatically
        $type = $this->assetTypeRegistry->determineType($file);

        // Validate using type-specific rules
        $errors = $this->assetTypeRegistry->validate($file);

        // Extract type-specific metadata
        $metadata = $this->assetTypeRegistry->extractMetadata($file);

        // ... create asset with $type and $metadata
    }
}
```

## Frontend Architecture

### Directory Structure

```
frontend/src/
├── types/
│   └── assetTypes.ts              # TypeScript interfaces
├── config/
│   └── assetTypeRegistry.ts       # Registry configuration
└── components/assetRenderers/
    ├── index.ts                   # Exports
    ├── ImageRenderer.tsx          # Image preview
    ├── VideoRenderer.tsx          # Video player
    ├── PdfRenderer.tsx            # PDF iframe
    ├── DesignRenderer.tsx         # Fallback for design files
    ├── VideoControls.tsx          # Video playback controls
    └── AnnotationOverlay.tsx      # Annotation drawing layer
```

### Type Interfaces

```typescript
// AssetRendererProps - passed to all renderers
interface AssetRendererProps {
  fileUrl: string;
  title: string;
  mediaRef: RefObject<HTMLElement | null>;
  onLoad?: () => void;
  // Video-specific (optional)
  currentTime?: number;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  onPlayChange?: (isPlaying: boolean) => void;
}

// AssetTypeHandler - registry entry configuration
interface AssetTypeHandler {
  type: string;
  displayName: string;
  icon: LucideIcon;
  mimePatterns: string[];
  extensions: string[];
  annotations: {
    supportsSpatialAnnotations: boolean;
    supportsTemporalAnnotations: boolean;
  };
  Renderer: FC<AssetRendererProps>;
  Controls?: FC<VideoControlsProps>;
  getMediaUrl?: (storageUrl: string) => string;
  supportsThumbnail: boolean;
}
```

### Registry Configuration

```typescript
// frontend/src/config/assetTypeRegistry.ts

export const assetTypeRegistry: Record<string, AssetTypeHandler> = {
  image: {
    type: 'image',
    displayName: 'Image',
    icon: FileImage,
    mimePatterns: ['image/'],
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    annotations: {
      supportsSpatialAnnotations: true,
      supportsTemporalAnnotations: false,
    },
    Renderer: ImageRenderer,
    supportsThumbnail: true,
  },

  video: {
    type: 'video',
    displayName: 'Video',
    icon: Film,
    mimePatterns: ['video/'],
    extensions: ['mp4', 'mov', 'webm'],
    annotations: {
      supportsSpatialAnnotations: true,
      supportsTemporalAnnotations: true,
    },
    Renderer: VideoRenderer,
    Controls: VideoControls,
    getMediaUrl: getVideoStreamUrl,
    supportsThumbnail: true,
  },

  pdf: {
    type: 'pdf',
    displayName: 'PDF Document',
    icon: FileText,
    mimePatterns: ['application/pdf'],
    extensions: ['pdf'],
    annotations: {
      supportsSpatialAnnotations: false,
      supportsTemporalAnnotations: false,
    },
    Renderer: PdfRenderer,
    supportsThumbnail: false,
  },

  design: {
    type: 'design',
    displayName: 'Design File',
    icon: FileQuestion,
    mimePatterns: ['application/postscript', ...],
    extensions: ['ai', 'psd', 'sketch', 'fig'],
    annotations: {
      supportsSpatialAnnotations: false,
      supportsTemporalAnnotations: false,
    },
    Renderer: DesignRenderer,
    supportsThumbnail: false,
  },
};
```

### Helper Functions

```typescript
// Get handler for a type
export function getAssetTypeHandler(type: string): AssetTypeHandler | undefined;

// Check annotation support
export function supportsSpatialAnnotations(type: string): boolean;
export function supportsTemporalAnnotations(type: string): boolean;
export function supportsAnnotations(type: string): boolean;

// Get icon and display name
export function getAssetTypeIcon(type: string): LucideIcon;
export function getAssetTypeDisplayName(type: string): string;

// URL transformation
export function getMediaUrlForType(url: string, type: string): string;

// Thumbnail support
export function supportsThumbnail(type: string): boolean;
```

### Usage in Components

```tsx
// Dynamic rendering based on type
const handler = getAssetTypeHandler(asset.type);
const Renderer = handler?.Renderer;

return (
  <>
    {Renderer && (
      <Renderer
        fileUrl={getMediaUrlForType(version.file_url, asset.type)}
        title={asset.title}
        mediaRef={mediaRef}
        onLoad={updateMediaBounds}
        onTimeUpdate={setCurrentTime}
        onDurationChange={setDuration}
        onPlayChange={setIsPlaying}
      />
    )}

    {/* Conditional annotation overlay */}
    {supportsSpatialAnnotations(asset.type) && (
      <AnnotationOverlay ... />
    )}

    {/* Conditional video controls */}
    {handler?.Controls && (
      <handler.Controls videoRef={mediaRef} ... />
    )}
  </>
);
```

## Adding a New Asset Type

### Example: Adding Audio Support

#### 1. Backend Handler

Create `backend/app/Services/AssetTypes/AudioHandler.php`:

```php
<?php

namespace App\Services\AssetTypes;

class AudioHandler extends BaseAssetTypeHandler
{
    protected int $maxFileSize = 100 * 1024 * 1024; // 100 MB

    public function getType(): string
    {
        return 'audio';
    }

    public function getDisplayName(): string
    {
        return 'Audio';
    }

    public function getMimePatterns(): array
    {
        return ['audio/'];
    }

    public function getExtensions(): array
    {
        return ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'];
    }

    public function supportsTemporalAnnotations(): bool
    {
        return true; // Audio has timestamps
    }

    public function getAllowedMimeTypes(): array
    {
        return [
            'audio/mpeg',
            'audio/wav',
            'audio/ogg',
            'audio/flac',
            'audio/mp4',
            'audio/aac',
        ];
    }
}
```

#### 2. Register Backend Handler

In `AssetTypeServiceProvider.php`:

```php
$registry->register(new AudioHandler());
```

#### 3. Frontend Renderer

Create `frontend/src/components/assetRenderers/AudioRenderer.tsx`:

```tsx
import { FC, useCallback } from 'react';
import { AssetRendererProps } from '../../types/assetTypes';

export const AudioRenderer: FC<AssetRendererProps> = ({
  fileUrl,
  mediaRef,
  onLoad,
  onTimeUpdate,
  onDurationChange,
  onPlayChange,
}) => {
  const handleTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLAudioElement>) => {
    onTimeUpdate?.(e.currentTarget.currentTime);
  }, [onTimeUpdate]);

  const handleLoadedMetadata = useCallback((e: React.SyntheticEvent<HTMLAudioElement>) => {
    onDurationChange?.(e.currentTarget.duration);
    onLoad?.();
  }, [onDurationChange, onLoad]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Music className="w-24 h-24 text-gray-400 mb-4" />
      <audio
        ref={mediaRef as React.RefObject<HTMLAudioElement>}
        src={fileUrl}
        controls
        className="w-full max-w-md"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => onPlayChange?.(true)}
        onPause={() => onPlayChange?.(false)}
      />
    </div>
  );
};
```

#### 4. Register Frontend Handler

In `frontend/src/config/assetTypeRegistry.ts`:

```typescript
import { Music } from 'lucide-react';
import { AudioRenderer } from '../components/assetRenderers/AudioRenderer';

export const assetTypeRegistry: Record<string, AssetTypeHandler> = {
  // ... existing types ...

  audio: {
    type: 'audio',
    displayName: 'Audio',
    icon: Music,
    mimePatterns: ['audio/'],
    extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'],
    annotations: {
      supportsSpatialAnnotations: false,
      supportsTemporalAnnotations: true,
    },
    Renderer: AudioRenderer,
    supportsThumbnail: false,
  },
};
```

#### 5. Export Renderer

In `frontend/src/components/assetRenderers/index.ts`:

```typescript
export { AudioRenderer } from './AudioRenderer';
```

**That's it!** The audio type will now:
- Be automatically detected on upload
- Render with the AudioRenderer component
- Support time-based comments
- Show the Music icon in asset lists
- Work in version comparison

## Database Schema

The `assets.type` column is a `VARCHAR(50)` to allow unlimited type values:

```php
// Migration: 2026_01_16_000001_change_asset_type_to_string.php
Schema::table('assets', function (Blueprint $table) {
    $table->string('type', 50)->default('image');
    $table->index('type');
});
```

This replaces the previous `ENUM('image', 'video', 'pdf', 'design')` constraint.

## Annotation Capabilities

| Type   | Spatial Annotations | Temporal Annotations |
|--------|--------------------|--------------------|
| Image  | Yes                | No                 |
| Video  | Yes                | Yes                |
| PDF    | No                 | No                 |
| Design | No                 | No                 |
| Audio* | No                 | Yes                |

*Audio example - not yet implemented

- **Spatial**: Position-based annotations (x, y, width, height rectangles)
- **Temporal**: Time-based annotations (timestamp in seconds)

## File Size Limits

| Type   | Max Size |
|--------|----------|
| Image  | 50 MB    |
| Video  | 500 MB   |
| PDF    | 50 MB    |
| Design | 100 MB   |

Limits are defined in each handler's `$maxFileSize` property.

## Best Practices

1. **Always extend BaseAssetTypeHandler** - It provides sensible defaults
2. **Use MIME pattern prefixes** - e.g., `'image/'` matches all image types
3. **Include extension fallbacks** - Some files have incorrect MIME types
4. **Set appropriate file size limits** - Consider server and user constraints
5. **Document annotation capabilities** - Users need to know what's supported
6. **Test with various files** - Edge cases in MIME detection are common

## Frontend Component Architecture

The AssetReview page follows a modular architecture for maintainability:

### Directory Structure

```
frontend/src/
├── pages/
│   └── AssetReview.tsx              # Orchestration (~500 lines)
├── components/
│   ├── assetReview/
│   │   ├── AssetPreview.tsx         # Renderer + controls
│   │   ├── ActivityPanel.tsx        # Comments + timeline
│   │   ├── VersionSelector.tsx      # Version navigation
│   │   ├── HeaderActions.tsx        # Toolbar actions
│   │   └── index.ts
│   ├── modals/
│   │   ├── Modal.tsx                # Base modal wrapper
│   │   ├── ApproveModal.tsx
│   │   ├── RevisionModal.tsx
│   │   ├── UploadVersionModal.tsx
│   │   ├── EditAssetModal.tsx
│   │   ├── DeleteConfirmModal.tsx
│   │   └── index.ts
│   └── assetRenderers/              # Type-specific renderers
├── hooks/
│   ├── useAssetReviewState.ts       # Reducer-based state management
│   ├── useTemporalSeek.ts           # Video/audio timestamp navigation
│   ├── useAssetActions.ts           # Role-based action permissions
│   └── index.ts
└── utils/
    └── time.ts                      # Time formatting utilities
```

### State Management

The `useAssetReviewState` hook consolidates UI state into a single reducer:

```typescript
import { useAssetReviewState, ModalType } from '../hooks';

const {
  state,           // Current state object
  openModal,       // (modal: ModalType) => void
  closeModal,      // () => void
  toggleTimeline,  // () => void
  startDrawing,    // (rect: Rectangle) => void
  finishDrawing,   // (rect: Rectangle | null) => void
  setCurrentTime,  // (time: number) => void
  // ... more actions
} = useAssetReviewState();

// Access state
state.activeModal    // 'approve' | 'revision' | 'upload' | 'edit' | 'delete' | 'compare' | null
state.isDrawing      // boolean
state.currentTime    // number
state.selectedRect   // Rectangle | null
```

### Temporal Seeking

The `useTemporalSeek` hook centralizes video/audio timestamp navigation:

```typescript
import { useTemporalSeek } from '../hooks';

const { seekToTimestamp, canSeek } = useTemporalSeek({
  mediaRef,
  assetType: asset.type,
  onTimeChange: setCurrentTime,
});

// Seek to annotation's timestamp (accounts for visibility window)
seekToTimestamp(comment.video_timestamp);
```

## Testing Handlers

### Backend Handler Tests

```php
// tests/Unit/Services/AssetTypes/ImageHandlerTest.php
use App\Services\AssetTypes\ImageHandler;
use Illuminate\Http\UploadedFile;

class ImageHandlerTest extends TestCase
{
    private ImageHandler $handler;

    protected function setUp(): void
    {
        parent::setUp();
        $this->handler = new ImageHandler();
    }

    public function test_supports_jpeg_file(): void
    {
        $file = UploadedFile::fake()->create('test.jpg', 100, 'image/jpeg');
        $this->assertTrue($this->handler->supports($file));
    }

    public function test_rejects_video_file(): void
    {
        $file = UploadedFile::fake()->create('test.mp4', 100, 'video/mp4');
        $this->assertFalse($this->handler->supports($file));
    }

    public function test_extracts_image_dimensions(): void
    {
        $file = UploadedFile::fake()->image('test.jpg', 800, 600);
        $metadata = $this->handler->extractMetadata($file);

        $this->assertEquals(800, $metadata['width']);
        $this->assertEquals(600, $metadata['height']);
    }

    public function test_validates_file_size(): void
    {
        // 60MB file should fail (max is 50MB)
        $file = UploadedFile::fake()->create('large.jpg', 60 * 1024, 'image/jpeg');
        $errors = $this->handler->validate($file);

        $this->assertContains('File size exceeds maximum', $errors);
    }
}
```

### Registry Tests

```php
// tests/Unit/Services/AssetTypes/AssetTypeRegistryTest.php
use App\Services\AssetTypes\AssetTypeRegistry;

class AssetTypeRegistryTest extends TestCase
{
    public function test_determines_image_type(): void
    {
        $registry = app(AssetTypeRegistry::class);
        $file = UploadedFile::fake()->image('test.png');

        $type = $registry->determineType($file);

        $this->assertEquals('image', $type);
    }

    public function test_determines_video_type(): void
    {
        $registry = app(AssetTypeRegistry::class);
        $file = UploadedFile::fake()->create('test.mp4', 100, 'video/mp4');

        $type = $registry->determineType($file);

        $this->assertEquals('video', $type);
    }

    public function test_falls_back_to_design_for_unknown_types(): void
    {
        $registry = app(AssetTypeRegistry::class);
        $file = UploadedFile::fake()->create('test.xyz', 100, 'application/octet-stream');

        $type = $registry->determineType($file);

        $this->assertEquals('design', $type);
    }
}
```

### Frontend Component Tests

```typescript
// __tests__/config/assetTypeRegistry.test.ts
import {
  getAssetTypeHandler,
  supportsSpatialAnnotations,
  supportsTemporalAnnotations,
} from '../../src/config/assetTypeRegistry';

describe('assetTypeRegistry', () => {
  test('returns image handler for image type', () => {
    const handler = getAssetTypeHandler('image');
    expect(handler?.type).toBe('image');
    expect(handler?.displayName).toBe('Image');
  });

  test('returns undefined for unknown type', () => {
    const handler = getAssetTypeHandler('unknown');
    expect(handler).toBeUndefined();
  });

  test('image supports spatial annotations', () => {
    expect(supportsSpatialAnnotations('image')).toBe(true);
  });

  test('image does not support temporal annotations', () => {
    expect(supportsTemporalAnnotations('image')).toBe(false);
  });

  test('video supports both annotation types', () => {
    expect(supportsSpatialAnnotations('video')).toBe(true);
    expect(supportsTemporalAnnotations('video')).toBe(true);
  });

  test('pdf does not support annotations', () => {
    expect(supportsSpatialAnnotations('pdf')).toBe(false);
    expect(supportsTemporalAnnotations('pdf')).toBe(false);
  });
});
```

### Integration Tests

```typescript
// __tests__/components/assetReview/AssetPreview.test.tsx
import { render, screen } from '@testing-library/react';
import { AssetPreview } from '../../src/components/assetReview';

describe('AssetPreview', () => {
  const mockAsset = {
    id: '1',
    type: 'image',
    title: 'Test Image',
    // ... other required fields
  };

  test('renders image renderer for image type', () => {
    render(<AssetPreview asset={mockAsset} ... />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  test('renders annotation overlay for spatial-enabled types', () => {
    render(<AssetPreview asset={mockAsset} ... />);
    // Annotation overlay should be present
  });

  test('does not render annotation overlay for PDF', () => {
    const pdfAsset = { ...mockAsset, type: 'pdf' };
    render(<AssetPreview asset={pdfAsset} ... />);
    // Annotation overlay should not be present
  });
});
```

## Error Handling

### Type Detection Fallback

When type detection fails, the registry falls back to `design`:

```php
public function determineType(UploadedFile $file): string
{
    foreach ($this->handlers as $handler) {
        if ($handler->supports($file)) {
            return $handler->getType();
        }
    }
    return 'design'; // Fallback
}
```

### Frontend Graceful Degradation

```typescript
const handler = getAssetTypeHandler(asset.type);
if (!handler) {
  // Show fallback UI or error message
  return <UnsupportedTypeMessage type={asset.type} />;
}

const Renderer = handler.Renderer;
return <Renderer fileUrl={mediaUrl} ... />;
```

### Validation Error Messages

Handlers return arrays of validation errors:

```php
public function validate(UploadedFile $file): array
{
    $errors = [];

    if ($file->getSize() > $this->maxFileSize) {
        $errors[] = sprintf(
            'File size (%s MB) exceeds maximum allowed (%s MB)',
            round($file->getSize() / 1024 / 1024, 2),
            round($this->maxFileSize / 1024 / 1024, 2)
        );
    }

    if (!in_array($file->getMimeType(), $this->getAllowedMimeTypes())) {
        $errors[] = 'File type not supported for ' . $this->getDisplayName();
    }

    return $errors;
}
```

## Migration Guide

### From Hardcoded Type Checks

**Before:**
```typescript
{asset.type === 'image' && <img src={url} />}
{asset.type === 'video' && <video src={url} />}
{asset.type === 'pdf' && <iframe src={url} />}
```

**After:**
```typescript
const handler = getAssetTypeHandler(asset.type);
const Renderer = handler?.Renderer;
{Renderer && <Renderer fileUrl={url} ... />}
```

### From Switch Statements

**Before:**
```typescript
switch (asset.type) {
  case 'image': return <FileImage />;
  case 'video': return <Film />;
  default: return <FileQuestion />;
}
```

**After:**
```typescript
import { getAssetTypeIcon } from '../config/assetTypeRegistry';
const Icon = getAssetTypeIcon(asset.type);
return <Icon />;
```
