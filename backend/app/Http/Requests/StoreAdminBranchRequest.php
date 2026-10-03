<?php

namespace App\Http\Requests;

use App\Models\Branch;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreAdminBranchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    protected function prepareForValidation(): void
    {
        $values = [];

        foreach (['name', 'address', 'contact_number'] as $field) {
            if ($this->has($field) && is_string($this->input($field))) {
                $values[$field] = trim($this->input($field));
            }
        }

        if ($this->has('status') && is_string($this->input('status'))) {
            $values['status'] = strtolower(trim($this->input('status')));
        }

        $this->merge($values);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string', 'max:255'],
            'contact_number' => ['required', 'string', 'max:255'],
            'pickup_available' => ['sometimes', 'boolean'],
            'status' => ['sometimes', 'in:active,inactive'],
        ];
    }

    protected function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->has('name')) {
                return;
            }

            if (Branch::query()->whereRaw('LOWER(name) = ?', [strtolower((string) $this->input('name'))])->exists()) {
                $validator->errors()->add('name', 'A branch with this name already exists.');
            }
        });
    }
}
