<?php

namespace App\Http\Requests;

use App\Enums\Priority;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreativeRequestUpdateRequest extends FormRequest
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
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'assigned_to' => 'sometimes|uuid|exists:users,id',
            'deadline' => 'sometimes|date',
            'priority' => ['sometimes', Rule::in(Priority::values())],
            'specs' => 'nullable|array',
            'status' => 'sometimes|in:pending,in_progress,asset_submitted,completed',
        ];
    }
}
