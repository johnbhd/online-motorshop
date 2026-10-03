<?php

namespace App\Http\Requests;

use App\Models\Brand;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateAdminBrandRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    protected function prepareForValidation(): void
    {
        $values = [];

        if ($this->has('name') && is_string($this->input('name'))) {
            $values['name'] = trim($this->input('name'));
        }

        if ($this->has('description') && $this->input('description') === '') {
            $values['description'] = null;
        }

        $this->merge($values);
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('brands', 'name')->ignore($this->route('brand'))],
            'description' => ['sometimes', 'nullable', 'string'],
            'status' => ['sometimes', 'required', 'string', 'max:100'],
        ];
    }

    protected function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if (! $this->has('name') || $validator->errors()->has('name')) {
                return;
            }

            $routeBrand = $this->route('brand');
            $brandId = $routeBrand instanceof Brand ? $routeBrand->getKey() : $routeBrand;
            $duplicate = Brand::query()
                ->whereRaw('LOWER(name) = ?', [strtolower((string) $this->input('name'))])
                ->when($brandId, fn ($query) => $query->where('id', '!=', $brandId))
                ->exists();

            if ($duplicate) {
                $validator->errors()->add('name', 'A brand with this name already exists.');
            }
        });
    }
}
