<?php

namespace App\Http\Requests;

use App\Models\Comment;
use Illuminate\Foundation\Http\FormRequest;

class AssetRequestRevisionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Authorization handled by policy in controller
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $asset = $this->route('asset');

        $hasComments = Comment::where('asset_id', $asset->id)
            ->where('asset_version', $asset->current_version)
            ->exists();

        return [
            'comment' => [$hasComments ? 'nullable' : 'required', 'string'],
        ];
    }
}
