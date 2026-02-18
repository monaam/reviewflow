<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssetCreateDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'content' => 'required|string|max:1000000',
            'request_id' => 'nullable|uuid|exists:creative_requests,id',
        ];
    }
}
