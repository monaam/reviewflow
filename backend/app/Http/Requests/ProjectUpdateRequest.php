<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProjectUpdateRequest extends FormRequest
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
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'client_name' => 'nullable|string|max:255',
            'deadline' => 'nullable|date',
            'cover_image' => 'nullable|string',
            'status' => 'sometimes|in:active,on_hold,completed,archived',
        ];
    }
}
