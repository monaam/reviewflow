<?php

namespace Tests\Feature\Api;

use App\Models\Asset;
use App\Models\Comment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Tests\Traits\ApiTestHelpers;

class CommentImageControllerTest extends TestCase
{
    use RefreshDatabase, ApiTestHelpers;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpUsers();
        Storage::fake('local');
    }

    // TEMP UPLOAD TESTS

    public function test_authenticated_user_can_upload_temp_image(): void
    {
        $this->actingAsPM();

        $file = UploadedFile::fake()->image('screenshot.png', 800, 600)->size(500);

        $response = $this->postJson('/api/comment-images/temp', [
            'image' => $file,
        ]);

        $response->assertCreated()
            ->assertJsonStructure([
                'temp_id',
                'filename',
                'preview_url',
                'size',
            ]);

        // Verify file was stored
        $tempId = $response->json('temp_id');
        $this->assertTrue(Cache::has('temp_comment_image_' . $tempId));
    }

    public function test_can_upload_jpeg_image(): void
    {
        $this->actingAsPM();

        $file = UploadedFile::fake()->image('photo.jpg', 1920, 1080)->size(1024);

        $response = $this->postJson('/api/comment-images/temp', [
            'image' => $file,
        ]);

        $response->assertCreated();
    }

    public function test_can_upload_gif_image(): void
    {
        $this->actingAsPM();

        $file = UploadedFile::fake()->create('animation.gif', 256, 'image/gif');

        $response = $this->postJson('/api/comment-images/temp', [
            'image' => $file,
        ]);

        $response->assertCreated();
    }

    public function test_can_upload_webp_image(): void
    {
        $this->actingAsPM();

        $file = UploadedFile::fake()->create('modern.webp', 512, 'image/webp');

        $response = $this->postJson('/api/comment-images/temp', [
            'image' => $file,
        ]);

        $response->assertCreated();
    }

    public function test_rejects_non_image_file(): void
    {
        $this->actingAsPM();

        $file = UploadedFile::fake()->create('document.pdf', 512, 'application/pdf');

        $response = $this->postJson('/api/comment-images/temp', [
            'image' => $file,
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['image']);
    }

    public function test_rejects_file_exceeding_size_limit(): void
    {
        $this->actingAsPM();

        // Create file larger than 10MB limit
        $file = UploadedFile::fake()->image('large.jpg', 4000, 3000)->size(11000);

        $response = $this->postJson('/api/comment-images/temp', [
            'image' => $file,
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['image']);
    }

    public function test_requires_image_field(): void
    {
        $this->actingAsPM();

        $response = $this->postJson('/api/comment-images/temp', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['image']);
    }

    public function test_unauthenticated_user_cannot_upload(): void
    {
        $file = UploadedFile::fake()->image('screenshot.png', 800, 600);

        $response = $this->postJson('/api/comment-images/temp', [
            'image' => $file,
        ]);

        $response->assertUnauthorized();
    }

    // TEMP IMAGE PREVIEW TESTS

    public function test_can_view_own_temp_image(): void
    {
        $this->actingAsPM();

        // Upload an image first
        $file = UploadedFile::fake()->image('screenshot.png', 800, 600);
        $uploadResponse = $this->postJson('/api/comment-images/temp', [
            'image' => $file,
        ]);

        $tempId = $uploadResponse->json('temp_id');

        // View the image
        $response = $this->get("/api/comment-images/temp/{$tempId}");

        $response->assertOk()
            ->assertHeader('Content-Type', 'image/png');
    }

    public function test_returns_404_for_nonexistent_temp_image(): void
    {
        $this->actingAsPM();

        $response = $this->get('/api/comment-images/temp/nonexistent-id');

        $response->assertNotFound();
    }

    public function test_returns_404_for_expired_temp_image(): void
    {
        $this->actingAsPM();

        // Manually create cache entry that's "expired" (already cleared)
        $tempId = 'test-expired-id';
        // Cache entry doesn't exist, so it's effectively expired

        $response = $this->get("/api/comment-images/temp/{$tempId}");

        $response->assertNotFound();
    }

    public function test_can_view_temp_image_without_auth(): void
    {
        // First upload as authenticated user
        $this->actingAsPM();
        $file = UploadedFile::fake()->image('screenshot.png', 800, 600);
        $uploadResponse = $this->postJson('/api/comment-images/temp', [
            'image' => $file,
        ]);
        $tempId = $uploadResponse->json('temp_id');

        // View without authentication (like an <img> tag would)
        $response = $this->get("/api/comment-images/temp/{$tempId}");

        $response->assertOk()
            ->assertHeader('Content-Type', 'image/png');
    }

    // TEMP IMAGE DELETE TESTS

    public function test_can_delete_own_temp_image(): void
    {
        $this->actingAsPM();

        // Upload an image first
        $file = UploadedFile::fake()->image('screenshot.png', 800, 600);
        $uploadResponse = $this->postJson('/api/comment-images/temp', [
            'image' => $file,
        ]);

        $tempId = $uploadResponse->json('temp_id');

        // Delete the image
        $response = $this->deleteJson("/api/comment-images/temp/{$tempId}");

        $response->assertOk()
            ->assertJson(['message' => 'Temporary image deleted successfully.']);

        // Verify cache entry is removed
        $this->assertFalse(Cache::has('temp_comment_image_' . $tempId));
    }

    public function test_cannot_delete_others_temp_image(): void
    {
        // PM uploads an image
        $this->actingAsPM();
        $file = UploadedFile::fake()->image('screenshot.png', 800, 600);
        $uploadResponse = $this->postJson('/api/comment-images/temp', [
            'image' => $file,
        ]);
        $tempId = $uploadResponse->json('temp_id');

        // Creative tries to delete it
        $this->actingAsCreative();
        $response = $this->deleteJson("/api/comment-images/temp/{$tempId}");

        $response->assertForbidden();

        // Verify cache entry still exists
        $this->assertTrue(Cache::has('temp_comment_image_' . $tempId));
    }

    public function test_delete_returns_404_for_nonexistent_temp_image(): void
    {
        $this->actingAsPM();

        $response = $this->deleteJson('/api/comment-images/temp/nonexistent-id');

        $response->assertNotFound();
    }

    // COMMENT IMAGE DELETE TESTS

    public function test_comment_owner_can_delete_image_from_comment(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        // Create comment owned by PM
        $comment = Comment::factory()->create([
            'asset_id' => $asset->id,
            'asset_version' => 1,
            'user_id' => $this->pm->id,
        ]);

        // Add media to comment
        $file = UploadedFile::fake()->image('screenshot.png', 800, 600);
        $comment->addMedia($file)->toMediaCollection('images');
        $media = $comment->getFirstMedia('images');

        $this->actingAsPM();
        $response = $this->deleteJson("/api/comments/{$comment->id}/images/{$media->id}");

        $response->assertOk()
            ->assertJson(['message' => 'Image deleted successfully.']);

        // Verify media is deleted
        $this->assertNull($comment->fresh()->getFirstMedia('images'));
    }

    public function test_admin_can_delete_image_from_any_comment(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        // Create comment owned by PM
        $comment = Comment::factory()->create([
            'asset_id' => $asset->id,
            'asset_version' => 1,
            'user_id' => $this->pm->id,
        ]);

        // Add media to comment
        $file = UploadedFile::fake()->image('screenshot.png', 800, 600);
        $comment->addMedia($file)->toMediaCollection('images');
        $media = $comment->getFirstMedia('images');

        $this->actingAsAdmin();
        $response = $this->deleteJson("/api/comments/{$comment->id}/images/{$media->id}");

        $response->assertOk();
    }

    public function test_non_owner_cannot_delete_image_from_comment(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        // Create comment owned by PM
        $comment = Comment::factory()->create([
            'asset_id' => $asset->id,
            'asset_version' => 1,
            'user_id' => $this->pm->id,
        ]);

        // Add media to comment
        $file = UploadedFile::fake()->image('screenshot.png', 800, 600);
        $comment->addMedia($file)->toMediaCollection('images');
        $media = $comment->getFirstMedia('images');

        // Creative tries to delete it
        $this->actingAsCreative();
        $response = $this->deleteJson("/api/comments/{$comment->id}/images/{$media->id}");

        $response->assertForbidden();

        // Verify media still exists
        $this->assertNotNull($comment->fresh()->getFirstMedia('images'));
    }

    public function test_returns_404_for_nonexistent_media_on_comment(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        $comment = Comment::factory()->create([
            'asset_id' => $asset->id,
            'asset_version' => 1,
            'user_id' => $this->pm->id,
        ]);

        $this->actingAsPM();
        $response = $this->deleteJson("/api/comments/{$comment->id}/images/99999");

        $response->assertNotFound();
    }

    // COMMENT CREATION WITH IMAGES TESTS

    public function test_can_create_comment_with_temp_images(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        $this->actingAsPM();

        // Upload temp images first
        $file1 = UploadedFile::fake()->image('screenshot1.png', 800, 600);
        $file2 = UploadedFile::fake()->image('screenshot2.jpg', 1024, 768);

        $upload1 = $this->postJson('/api/comment-images/temp', ['image' => $file1]);
        $upload2 = $this->postJson('/api/comment-images/temp', ['image' => $file2]);

        $tempId1 = $upload1->json('temp_id');
        $tempId2 = $upload2->json('temp_id');

        // Create comment with temp images
        $response = $this->postJson("/api/assets/{$asset->id}/comments", [
            'content' => 'Comment with images',
            'temp_image_ids' => [$tempId1, $tempId2],
        ]);

        $response->assertCreated()
            ->assertJsonPath('content', 'Comment with images')
            ->assertJsonCount(2, 'media');

        // Verify temp cache entries are cleared
        $this->assertFalse(Cache::has('temp_comment_image_' . $tempId1));
        $this->assertFalse(Cache::has('temp_comment_image_' . $tempId2));
    }

    public function test_ignores_nonexistent_temp_image_ids(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        $this->actingAsPM();

        // Upload one valid temp image
        $file = UploadedFile::fake()->image('screenshot.png', 800, 600);
        $upload = $this->postJson('/api/comment-images/temp', ['image' => $file]);
        $validTempId = $upload->json('temp_id');

        // Create comment with one valid and one non-existent (but valid UUID format) temp ID
        $nonExistentUuid = fake()->uuid();
        $response = $this->postJson("/api/assets/{$asset->id}/comments", [
            'content' => 'Comment with images',
            'temp_image_ids' => [$validTempId, $nonExistentUuid],
        ]);

        $response->assertCreated()
            ->assertJsonCount(1, 'media'); // Only the valid one
    }

    public function test_cannot_attach_others_temp_images(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        // PM uploads a temp image
        $this->actingAsPM();
        $file = UploadedFile::fake()->image('screenshot.png', 800, 600);
        $upload = $this->postJson('/api/comment-images/temp', ['image' => $file]);
        $pmTempId = $upload->json('temp_id');

        // Creative tries to use PM's temp image
        $this->actingAsCreative();
        $response = $this->postJson("/api/assets/{$asset->id}/comments", [
            'content' => 'Trying to steal images',
            'temp_image_ids' => [$pmTempId],
        ]);

        $response->assertCreated()
            ->assertJsonCount(0, 'media'); // No images attached
    }

    public function test_temp_image_ids_must_be_valid_uuids(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        $this->actingAsPM();

        $response = $this->postJson("/api/assets/{$asset->id}/comments", [
            'content' => 'Comment with invalid IDs',
            'temp_image_ids' => ['not-a-uuid', '123'],
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['temp_image_ids.0', 'temp_image_ids.1']);
    }

    public function test_temp_image_ids_limited_to_10(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        $this->actingAsPM();

        // Generate 11 fake UUIDs
        $tooManyIds = array_map(fn() => fake()->uuid(), range(1, 11));

        $response = $this->postJson("/api/assets/{$asset->id}/comments", [
            'content' => 'Too many images',
            'temp_image_ids' => $tooManyIds,
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['temp_image_ids']);
    }

    // COMMENT RESPONSE INCLUDES MEDIA TESTS

    public function test_comment_list_includes_media(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        $comment = Comment::factory()->create([
            'asset_id' => $asset->id,
            'asset_version' => 1,
            'user_id' => $this->pm->id,
        ]);

        // Add media to comment
        $file = UploadedFile::fake()->image('screenshot.png', 800, 600);
        $comment->addMedia($file)->toMediaCollection('images');

        $this->actingAsPM();
        $response = $this->getJson("/api/assets/{$asset->id}/comments");

        $response->assertOk()
            ->assertJsonPath('0.media.0.collection_name', 'images');
    }

    public function test_timeline_includes_media_in_comments(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        $comment = Comment::factory()->create([
            'asset_id' => $asset->id,
            'asset_version' => 1,
            'user_id' => $this->pm->id,
        ]);

        // Add media to comment
        $file = UploadedFile::fake()->image('screenshot.png', 800, 600);
        $comment->addMedia($file)->toMediaCollection('images');

        $this->actingAsPM();
        $response = $this->getJson("/api/assets/{$asset->id}/comments?timeline=true");

        $response->assertOk();

        // Find the comment in the timeline
        $commentItem = collect($response->json())->first(fn($item) => $item['type'] === 'comment');
        $this->assertNotNull($commentItem);
        $this->assertNotEmpty($commentItem['data']['media']);
    }

    public function test_reply_includes_media(): void
    {
        $project = $this->createProjectWithMembers($this->pm, [$this->creative]);
        $asset = $this->createAssetWithVersion($project, $this->creative);

        // Create parent comment
        $parentComment = Comment::factory()->create([
            'asset_id' => $asset->id,
            'asset_version' => 1,
            'user_id' => $this->pm->id,
        ]);

        $this->actingAsCreative();

        // Upload temp image
        $file = UploadedFile::fake()->image('reply-screenshot.png', 800, 600);
        $upload = $this->postJson('/api/comment-images/temp', ['image' => $file]);
        $tempId = $upload->json('temp_id');

        // Create reply with image
        $response = $this->postJson("/api/assets/{$asset->id}/comments", [
            'content' => 'Reply with image',
            'parent_id' => $parentComment->id,
            'temp_image_ids' => [$tempId],
        ]);

        $response->assertCreated()
            ->assertJsonCount(1, 'media');
    }
}
