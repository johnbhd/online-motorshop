<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCustomerProfileRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $values = [];

        foreach (['name', 'email', 'contact_number', 'address'] as $field) {
            if ($this->has($field) && is_string($this->input($field))) {
                $values[$field] = trim($this->input($field));
            }
        }

        if (isset($values['email'])) {
            $values['email'] = strtolower($values['email']);
        }

        if (array_key_exists('address', $values) && $values['address'] === '') {
            $values['address'] = null;
        }

        $this->merge($values);
    }

    public function authorize(): bool
    {
        return $this->user()?->role === 'customer';
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($this->user()?->getKey()),
            ],
            'contact_number' => ['required', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:255'],
        ];
    }
}
