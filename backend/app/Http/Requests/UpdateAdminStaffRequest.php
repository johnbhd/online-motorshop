<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAdminStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    protected function prepareForValidation(): void
    {
        $values = [];

        foreach (['name', 'email'] as $field) {
            if ($this->has($field) && is_string($this->input($field))) {
                $values[$field] = trim($this->input($field));
            }
        }

        if (isset($values['email'])) {
            $values['email'] = strtolower($values['email']);
        }

        $this->merge($values);
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($this->route('staff')),
            ],
            'branch_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('branches', 'id')->where(fn ($query) => $query->where('status', 'active')),
            ],
            'status' => ['sometimes', 'required', 'in:active,inactive'],
        ];
    }
}
