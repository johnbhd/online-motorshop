<?php

namespace App\Http\Requests;

use App\Models\MediaAsset;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminMediaIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
            'type' => ['sometimes', 'nullable', 'string', Rule::in(MediaAsset::PURPOSE_VALUES)],
            'status' => ['sometimes', 'nullable', 'string', Rule::in(MediaAsset::STATUS_VALUES)],
            'sort' => ['sometimes', 'nullable', 'string', Rule::in(['newest', 'oldest', 'status', 'type'])],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}
