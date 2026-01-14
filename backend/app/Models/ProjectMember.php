<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectMember extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'project_id',
        'user_id',
        'role_in_project',
        'notify_on_upload',
        'notify_on_comment',
        'notify_on_approval',
    ];

    protected function casts(): array
    {
        return [
            'notify_on_upload' => 'boolean',
            'notify_on_comment' => 'boolean',
            'notify_on_approval' => 'boolean',
            'added_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
