<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetPublishedLink extends Model
{
    use HasUuids;

    protected $fillable = [
        'asset_id',
        'asset_version',
        'url',
        'platform',
        'published_by',
    ];

    protected $casts = [
        'asset_version' => 'integer',
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function publisher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'published_by');
    }

    /**
     * Detect the social media platform from a URL.
     */
    public static function detectPlatform(string $url): ?string
    {
        $host = parse_url($url, PHP_URL_HOST);
        if (!$host) {
            return null;
        }

        $host = strtolower(preg_replace('/^www\./', '', $host));

        $platforms = [
            'instagram.com' => 'instagram',
            'facebook.com' => 'facebook',
            'fb.com' => 'facebook',
            'fb.watch' => 'facebook',
            'twitter.com' => 'twitter',
            'x.com' => 'twitter',
            'youtube.com' => 'youtube',
            'youtu.be' => 'youtube',
            'tiktok.com' => 'tiktok',
            'linkedin.com' => 'linkedin',
            'pinterest.com' => 'pinterest',
            'pin.it' => 'pinterest',
            'behance.net' => 'behance',
            'dribbble.com' => 'dribbble',
            'vimeo.com' => 'vimeo',
            'threads.net' => 'threads',
            'snapchat.com' => 'snapchat',
        ];

        foreach ($platforms as $domain => $platform) {
            if ($host === $domain || str_ends_with($host, '.' . $domain)) {
                return $platform;
            }
        }

        return null;
    }
}
