<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CommentStoreRequest extends FormRequest
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
        return [
            'content' => 'required|string|max:5000',
            'rectangle' => 'nullable|array',
            'rectangle.x' => 'required_with:rectangle|numeric|min:0|max:1',
            'rectangle.y' => 'required_with:rectangle|numeric|min:0|max:1',
            'rectangle.width' => 'required_with:rectangle|numeric|min:0|max:1',
            'rectangle.height' => 'required_with:rectangle|numeric|min:0|max:1',
            'video_timestamp' => 'nullable|numeric|min:0',
            'page_number' => 'nullable|integer|min:1',
            'text_anchor' => 'nullable|array',
            'text_anchor.from' => 'required_with:text_anchor|integer|min:0',
            'text_anchor.to' => 'required_with:text_anchor|integer|min:0|gt:text_anchor.from',
            'text_anchor.selectedText' => 'required_with:text_anchor|string|max:5000',
            'parent_id' => 'nullable|uuid|exists:comments,id',
            'temp_image_ids' => 'nullable|array|max:10',
            'temp_image_ids.*' => 'uuid',
        ];
    }
}
