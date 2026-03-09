<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PdfPage extends Model
{
    use HasUuids;

    protected $fillable = [
        'asset_version_id',
        'page_number',
        'image_path',
        'width',
        'height',
        'file_size',
    ];

    protected function casts(): array
    {
        return [
            'page_number' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
            'file_size' => 'integer',
        ];
    }

    public function assetVersion(): BelongsTo
    {
        return $this->belongsTo(AssetVersion::class);
    }
}
