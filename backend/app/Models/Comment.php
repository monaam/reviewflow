<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comment extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'asset_id',
        'asset_version',
        'user_id',
        'content',
        'rectangle',
        'video_timestamp',
        'page_number',
        'is_resolved',
        'resolved_by',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'asset_version' => 'integer',
            'rectangle' => 'array',
            'video_timestamp' => 'float',
            'page_number' => 'integer',
            'is_resolved' => 'boolean',
            'resolved_at' => 'datetime',
        ];
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function hasAnnotation(): bool
    {
        return $this->rectangle !== null;
    }

    public function hasTimestamp(): bool
    {
        return $this->video_timestamp !== null;
    }

    public function hasPageNumber(): bool
    {
        return $this->page_number !== null;
    }

    public function getFormattedTimestampAttribute(): ?string
    {
        if ($this->video_timestamp === null) {
            return null;
        }

        $minutes = floor($this->video_timestamp / 60);
        $seconds = $this->video_timestamp % 60;

        return sprintf('%02d:%02d', $minutes, $seconds);
    }

    public function resolve(User $user): void
    {
        $this->update([
            'is_resolved' => true,
            'resolved_by' => $user->id,
            'resolved_at' => now(),
        ]);
    }

    public function unresolve(): void
    {
        $this->update([
            'is_resolved' => false,
            'resolved_by' => null,
            'resolved_at' => null,
        ]);
    }
}
