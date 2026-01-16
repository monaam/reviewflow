<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StreamController extends Controller
{
    public function stream(Request $request, string $path)
    {
        if (!Storage::exists($path)) {
            abort(404, 'File not found');
        }

        $filePath = Storage::path($path);
        $fileSize = Storage::size($path);
        $mimeType = Storage::mimeType($path) ?: 'application/octet-stream';

        // Get the range header
        $range = $request->header('Range');

        if ($range) {
            return $this->streamPartial($filePath, $fileSize, $mimeType, $range);
        }

        return $this->streamFull($filePath, $fileSize, $mimeType);
    }

    protected function streamFull(string $filePath, int $fileSize, string $mimeType): StreamedResponse
    {
        return response()->stream(function () use ($filePath) {
            $handle = fopen($filePath, 'rb');
            while (!feof($handle)) {
                echo fread($handle, 8192);
                flush();
            }
            fclose($handle);
        }, 200, [
            'Content-Type' => $mimeType,
            'Content-Length' => $fileSize,
            'Accept-Ranges' => 'bytes',
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }

    protected function streamPartial(string $filePath, int $fileSize, string $mimeType, string $range): StreamedResponse
    {
        // Parse the range header
        // Format: bytes=start-end or bytes=start-
        if (!preg_match('/bytes=(\d*)-(\d*)/', $range, $matches)) {
            abort(416, 'Invalid range format');
        }

        $start = $matches[1] !== '' ? (int) $matches[1] : 0;
        $end = $matches[2] !== '' ? (int) $matches[2] : $fileSize - 1;

        // Validate range
        if ($start > $end || $start >= $fileSize || $end >= $fileSize) {
            return response()->stream(function () {}, 416, [
                'Content-Range' => "bytes */$fileSize",
            ]);
        }

        $length = $end - $start + 1;

        return response()->stream(function () use ($filePath, $start, $length) {
            $handle = fopen($filePath, 'rb');
            fseek($handle, $start);

            $remaining = $length;
            while ($remaining > 0 && !feof($handle)) {
                $chunkSize = min(8192, $remaining);
                echo fread($handle, $chunkSize);
                flush();
                $remaining -= $chunkSize;
            }

            fclose($handle);
        }, 206, [
            'Content-Type' => $mimeType,
            'Content-Length' => $length,
            'Content-Range' => "bytes $start-$end/$fileSize",
            'Accept-Ranges' => 'bytes',
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}
