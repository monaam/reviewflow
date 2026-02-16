<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssetStoreRequest extends FormRequest
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
            'file' => 'required|file|max:512000', // 500MB
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'request_id' => 'nullable|uuid|exists:creative_requests,id',
        ];
    }
}
