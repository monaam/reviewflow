<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'description',
        'client_name',
        'deadline',
        'cover_image',
        'status',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'deadline' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_members')
            ->withPivot('role_in_project', 'notify_on_upload', 'notify_on_comment', 'notify_on_approval')
            ->withTimestamps();
    }

    public function assets(): HasMany
    {
        return $this->hasMany(Asset::class);
    }

    public function creativeRequests(): HasMany
    {
        return $this->hasMany(CreativeRequest::class);
    }

    public function getApprovalProgressAttribute(): float
    {
        $total = $this->assets()->count();
        if ($total === 0) return 0;

        $approved = $this->assets()->where('status', 'approved')->count();
        return round(($approved / $total) * 100, 1);
    }

    public function getPendingAssetsCountAttribute(): int
    {
        return $this->assets()->where('status', 'pending_review')->count();
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeForUser($query, User $user)
    {
        if ($user->isAdmin()) {
            return $query;
        }

        return $query->whereHas('members', function ($q) use ($user) {
            $q->where('users.id', $user->id);
        });
    }
}
