<?php

namespace Tests\Unit\Services;

use App\Services\AssetTypes\DocumentHandler;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class DocumentHandlerTest extends TestCase
{
    protected DocumentHandler $handler;

    protected function setUp(): void
    {
        parent::setUp();
        $this->handler = new DocumentHandler();
    }

    public function test_get_type_returns_document(): void
    {
        $this->assertEquals('document', $this->handler->getType());
    }

    public function test_get_display_name_returns_document(): void
    {
        $this->assertEquals('Document', $this->handler->getDisplayName());
    }

    public function test_get_mime_patterns_returns_empty_array(): void
    {
        $this->assertEquals([], $this->handler->getMimePatterns());
    }

    public function test_get_extensions_returns_empty_array(): void
    {
        $this->assertEquals([], $this->handler->getExtensions());
    }

    public function test_supports_returns_false_for_any_file(): void
    {
        $image = UploadedFile::fake()->image('test.jpg');
        $video = UploadedFile::fake()->create('test.mp4', 1024, 'video/mp4');
        $pdf = UploadedFile::fake()->create('test.pdf', 512, 'application/pdf');

        $this->assertFalse($this->handler->supports($image));
        $this->assertFalse($this->handler->supports($video));
        $this->assertFalse($this->handler->supports($pdf));
    }

    public function test_supports_spatial_annotations_returns_false(): void
    {
        $this->assertFalse($this->handler->supportsSpatialAnnotations());
    }

    public function test_supports_temporal_annotations_returns_false(): void
    {
        $this->assertFalse($this->handler->supportsTemporalAnnotations());
    }

    public function test_supports_text_annotations_returns_true(): void
    {
        $this->assertTrue($this->handler->supportsTextAnnotations());
    }
}
