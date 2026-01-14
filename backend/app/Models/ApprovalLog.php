<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalLog extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'asset_id',
        'asset_version',
        'user_id',
        'action',
        'comment',
    ];

    protected function casts(): array
    {
        return [
            'asset_version' => 'integer',
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

    public function isApproval(): bool
    {
        return $this->action === 'approved';
    }

    public function isRevisionRequest(): bool
    {
        return $this->action === 'revision_requested';
    }
}
