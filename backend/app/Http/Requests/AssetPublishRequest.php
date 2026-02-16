<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssetPublishRequest extends FormRequest
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
            'links' => 'required|array|min:1',
            'links.*.url' => 'required|url',
            'version' => 'nullable|integer|min:1',
        ];
    }
}
