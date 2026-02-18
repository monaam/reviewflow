<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuids, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'avatar',
        'is_active',
        'onesignal_player_id',
        'push_notifications_enabled',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'push_notifications_enabled' => 'boolean',
        ];
    }

    /**
     * Route notifications to OneSignal player ID.
     */
    public function routeNotificationForOneSignal(): ?string
    {
        return $this->onesignal_player_id;
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::ADMIN->value;
    }

    public function isPM(): bool
    {
        return $this->role === UserRole::PM->value;
    }

    public function isCreative(): bool
    {
        return $this->role === UserRole::CREATIVE->value;
    }

    public function isReviewer(): bool
    {
        return $this->role === UserRole::REVIEWER->value;
    }

    public function canApprove(): bool
    {
        return in_array($this->role, UserRole::canApprove());
    }

    /**
     * Check if user has managerial permissions (admin or PM)
     */
    public function isManagerial(): bool
    {
        return $this->isAdmin() || $this->isPM();
    }

    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_members')
            ->withPivot('role_in_project', 'notify_on_upload', 'notify_on_comment', 'notify_on_approval')
            ->withTimestamps();
    }

    public function ownedProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'created_by');
    }

    public function uploadedAssets(): HasMany
    {
        return $this->hasMany(Asset::class, 'uploaded_by');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function createdRequests(): HasMany
    {
        return $this->hasMany(CreativeRequest::class, 'created_by');
    }

    public function assignedRequests(): HasMany
    {
        return $this->hasMany(CreativeRequest::class, 'assigned_to');
    }

    public function approvalLogs(): HasMany
    {
        return $this->hasMany(ApprovalLog::class);
    }
}
