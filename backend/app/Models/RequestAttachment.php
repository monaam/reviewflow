<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RequestAttachment extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'request_id',
        'file_url',
        'file_name',
        'uploaded_by',
    ];

    public function creativeRequest(): BelongsTo
    {
        return $this->belongsTo(CreativeRequest::class, 'request_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
