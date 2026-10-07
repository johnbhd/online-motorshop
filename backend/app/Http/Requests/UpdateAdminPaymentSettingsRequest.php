<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAdminPaymentSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    protected function prepareForValidation(): void
    {
        $values = [];

        foreach (['gcash_account_name', 'gcash_number', 'payment_instructions'] as $field) {
            if ($this->has($field) && is_string($this->input($field))) {
                $trimmed = trim($this->input($field));
                $values[$field] = $trimmed === '' ? null : $trimmed;
            }
        }

        $this->merge($values);
    }

    public function rules(): array
    {
        return [
            'gcash_account_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'gcash_number' => ['sometimes', 'nullable', 'string', 'max:30'],
            'payment_instructions' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'qr_image' => ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'remove_qr_image' => ['sometimes', 'boolean'],
        ];
    }
}
