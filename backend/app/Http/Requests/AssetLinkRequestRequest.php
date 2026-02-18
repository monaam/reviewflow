<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssetLinkRequestRequest extends FormRequest
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
            'request_id' => 'required|uuid|exists:creative_requests,id',
        ];
    }
}
