<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AdminBranchIndexRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $value = $this->query('pickup_available');

        if (! is_string($value)) {
            return;
        }

        $normalized = match (strtolower($value)) {
            'true' => true,
            'false' => false,
            default => null,
        };

        if ($normalized !== null) {
            $this->merge(['pickup_available' => $normalized]);
        }
    }

    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
            'status' => ['sometimes', 'nullable', 'in:active,inactive'],
            'pickup_available' => ['sometimes', 'boolean'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}
