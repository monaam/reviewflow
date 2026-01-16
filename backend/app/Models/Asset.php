<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Asset extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'project_id',
        'uploaded_by',
        'title',
        'description',
        'type',
        'status',
        'current_version',
        'deadline',
        'is_locked',
        'locked_by',
        'locked_at',
    ];

    protected function casts(): array
    {
        return [
            'deadline' => 'datetime',
            'current_version' => 'integer',
            'is_locked' => 'boolean',
            'locked_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(AssetVersion::class)->orderBy('version_number', 'desc');
    }

    public function latestVersion()
    {
        return $this->hasOne(AssetVersion::class)->latestOfMany('version_number');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function approvalLogs(): HasMany
    {
        return $this->hasMany(ApprovalLog::class);
    }

    public function creativeRequests(): BelongsToMany
    {
        return $this->belongsToMany(CreativeRequest::class, 'request_assets', 'asset_id', 'request_id')
            ->withTimestamps();
    }

    public function getFileUrlAttribute(): ?string
    {
        return $this->latestVersion?->file_url;
    }

    public function getUnresolvedCommentsCountAttribute(): int
    {
        return $this->comments()
            ->where('asset_version', $this->current_version)
            ->where('is_resolved', false)
            ->count();
    }

    public function scopePendingReview($query)
    {
        return $query->where('status', 'pending_review');
    }

    public function scopeNeedsRevision($query)
    {
        return $query->where('status', 'revision_requested');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function locker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'locked_by');
    }

    public function versionLocks(): HasMany
    {
        return $this->hasMany(VersionLock::class);
    }

    public function lock(User $user, ?string $reason = null): void
    {
        $this->update([
            'is_locked' => true,
            'locked_by' => $user->id,
            'locked_at' => now(),
        ]);

        VersionLock::create([
            'asset_id' => $this->id,
            'user_id' => $user->id,
            'action' => 'locked',
            'reason' => $reason,
        ]);
    }

    public function unlock(User $user, ?string $reason = null): void
    {
        $this->update([
            'is_locked' => false,
            'locked_by' => null,
            'locked_at' => null,
        ]);

        VersionLock::create([
            'asset_id' => $this->id,
            'user_id' => $user->id,
            'action' => 'unlocked',
            'reason' => $reason,
        ]);
    }
}
