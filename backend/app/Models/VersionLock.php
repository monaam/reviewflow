<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VersionLock extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'asset_id',
        'user_id',
        'action',
        'reason',
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isLock(): bool
    {
        return $this->action === 'locked';
    }

    public function isUnlock(): bool
    {
        return $this->action === 'unlocked';
    }
}
