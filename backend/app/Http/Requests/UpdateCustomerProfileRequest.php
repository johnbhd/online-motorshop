<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCustomerProfileRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $values = [];

        foreach ([
            'name',
            'email',
            'contact_number',
            'address',
            'city_municipality',
            'barangay',
            'city_municipality_code',
            'barangay_code',
            'latitude',
            'longitude',
        ] as $field) {
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

        foreach (['city_municipality', 'barangay', 'city_municipality_code', 'barangay_code'] as $field) {
            if (array_key_exists($field, $values) && $values[$field] === '') {
                $values[$field] = null;
            }
        }

        foreach (['latitude', 'longitude'] as $field) {
            if (array_key_exists($field, $values) && $values[$field] === '') {
                $values[$field] = null;
            }
        }

        $this->merge($values);
    }

    public function authorize(): bool
    {
        return $this->user()?->role === 'customer';
    }

    public function rules(): array
    {
        $locationFieldsSubmitted = $this->locationFieldsSubmitted();
        $locationHasValue = $this->locationHasValue();

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
            'city_municipality' => [
                'nullable',
                'string',
                'max:255',
                Rule::requiredIf(fn (): bool => $locationFieldsSubmitted
                    && $locationHasValue
                    && ! $this->filled('city_municipality_code')),
            ],
            'barangay' => [
                'nullable',
                'string',
                'max:255',
                Rule::requiredIf(fn (): bool => $locationFieldsSubmitted
                    && $locationHasValue
                    && ! $this->filled('barangay_code')),
            ],
            'city_municipality_code' => [
                'nullable',
                'string',
                'regex:/^\d{10}$/',
            ],
            'barangay_code' => [
                'nullable',
                'string',
                'regex:/^\d{10}$/',
            ],
            'latitude' => [
                'nullable',
                'numeric',
                'between:-90,90',
                Rule::requiredIf(fn (): bool => $this->coordinateFieldHasValue('longitude')),
            ],
            'longitude' => [
                'nullable',
                'numeric',
                'between:-180,180',
                Rule::requiredIf(fn (): bool => $this->coordinateFieldHasValue('latitude')),
            ],
        ];
    }

    private function locationFieldsSubmitted(): bool
    {
        return array_intersect([
            'city_municipality',
            'barangay',
            'city_municipality_code',
            'barangay_code',
        ], array_keys($this->all())) !== [];
    }

    private function locationHasValue(): bool
    {
        foreach (['city_municipality', 'barangay', 'city_municipality_code', 'barangay_code'] as $field) {
            if ($this->input($field) !== null && $this->input($field) !== '') {
                return true;
            }
        }

        return false;
    }

    private function coordinateFieldHasValue(string $field): bool
    {
        return $this->input($field) !== null && $this->input($field) !== '';
    }
}
