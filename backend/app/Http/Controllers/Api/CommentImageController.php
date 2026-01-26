<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CommentImageController extends Controller
{
    /**
     * Upload a temporary image before comment submission.
     */
    public function uploadTemp(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,gif,webp|max:10240', // 10MB max
        ]);

        $file = $request->file('image');
        $tempId = Str::uuid()->toString();
        $filename = $file->getClientOriginalName();
        $extension = $file->getClientOriginalExtension();

        // Store the file temporarily
        $path = $file->storeAs(
            'temp-comment-images/' . $request->user()->id,
            $tempId . '.' . $extension,
            'local'
        );

        // Store metadata in cache for 24 hours
        Cache::put('temp_comment_image_' . $tempId, [
            'path' => $path,
            'filename' => $filename,
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'user_id' => $request->user()->id,
            'created_at' => now()->toIso8601String(),
        ], now()->addHours(24));

        // Generate preview URL
        $previewUrl = route('comment-images.temp.show', ['tempId' => $tempId]);

        return response()->json([
            'temp_id' => $tempId,
            'filename' => $filename,
            'preview_url' => $previewUrl,
            'size' => $file->getSize(),
        ], 201);
    }

    /**
     * Show a temporary image (for preview).
     */
    public function showTemp(string $tempId): mixed
    {
        $metadata = Cache::get('temp_comment_image_' . $tempId);

        if (!$metadata) {
            abort(404, 'Temporary image not found or expired.');
        }

        if (!Storage::disk('local')->exists($metadata['path'])) {
            abort(404, 'Temporary image file not found.');
        }

        return response()->file(
            Storage::disk('local')->path($metadata['path']),
            ['Content-Type' => $metadata['mime_type']]
        );
    }

    /**
     * Delete a pending temporary image.
     */
    public function deleteTemp(Request $request, string $tempId): JsonResponse
    {
        $metadata = Cache::get('temp_comment_image_' . $tempId);

        if (!$metadata) {
            return response()->json(['message' => 'Temporary image not found or already deleted.'], 404);
        }

        // Verify ownership
        if ($metadata['user_id'] !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Delete the file
        if (Storage::disk('local')->exists($metadata['path'])) {
            Storage::disk('local')->delete($metadata['path']);
        }

        // Remove from cache
        Cache::forget('temp_comment_image_' . $tempId);

        return response()->json(['message' => 'Temporary image deleted successfully.']);
    }

    /**
     * Remove an image from an existing comment.
     */
    public function destroy(Request $request, Comment $comment, int $mediaId): JsonResponse
    {
        $this->authorize('manageMedia', $comment);

        $media = $comment->getMedia('images')->firstWhere('id', $mediaId);

        if (!$media) {
            return response()->json(['message' => 'Image not found.'], 404);
        }

        $media->delete();

        return response()->json(['message' => 'Image deleted successfully.']);
    }

    /**
     * Attach temp images to a comment.
     * This is called internally by CommentController after comment creation.
     */
    public static function attachTempImagesToComment(Comment $comment, array $tempIds, string $userId): void
    {
        foreach ($tempIds as $tempId) {
            $metadata = Cache::get('temp_comment_image_' . $tempId);

            if (!$metadata) {
                continue;
            }

            // Verify ownership
            if ($metadata['user_id'] !== $userId) {
                continue;
            }

            $filePath = Storage::disk('local')->path($metadata['path']);

            if (!file_exists($filePath)) {
                continue;
            }

            // Add to comment's media collection
            $comment->addMedia($filePath)
                ->usingFileName($metadata['filename'])
                ->toMediaCollection('images');

            // Remove from cache
            Cache::forget('temp_comment_image_' . $tempId);
        }
    }
}
