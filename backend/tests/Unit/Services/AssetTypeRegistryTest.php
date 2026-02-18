<?php

namespace Tests\Unit\Services;

use App\Services\AssetTypes\AssetTypeRegistry;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class AssetTypeRegistryTest extends TestCase
{
    protected AssetTypeRegistry $registry;

    protected function setUp(): void
    {
        parent::setUp();
        $this->registry = app(AssetTypeRegistry::class);
    }

    public function test_document_handler_is_registered(): void
    {
        $handler = $this->registry->get('document');
        $this->assertNotNull($handler);
        $this->assertEquals('document', $handler->getType());
    }

    public function test_supports_text_annotations_returns_true_for_document(): void
    {
        $this->assertTrue($this->registry->supportsTextAnnotations('document'));
    }

    public function test_supports_text_annotations_returns_false_for_image(): void
    {
        $this->assertFalse($this->registry->supportsTextAnnotations('image'));
    }

    public function test_determine_type_never_returns_document(): void
    {
        $image = UploadedFile::fake()->image('test.jpg');
        $video = UploadedFile::fake()->create('test.mp4', 1024, 'video/mp4');
        $pdf = UploadedFile::fake()->create('test.pdf', 512, 'application/pdf');
        $generic = UploadedFile::fake()->create('test.txt', 100, 'text/plain');

        $this->assertNotEquals('document', $this->registry->determineType($image));
        $this->assertNotEquals('document', $this->registry->determineType($video));
        $this->assertNotEquals('document', $this->registry->determineType($pdf));
        $this->assertNotEquals('document', $this->registry->determineType($generic));
    }
}
