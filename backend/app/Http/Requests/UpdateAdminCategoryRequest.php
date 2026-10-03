<?php

namespace App\Http\Requests;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateAdminCategoryRequest extends FormRequest
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
            'name' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('categories', 'name')->ignore($this->route('category'))],
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

            $routeCategory = $this->route('category');
            $categoryId = $routeCategory instanceof Category ? $routeCategory->getKey() : $routeCategory;
            $duplicate = Category::query()
                ->whereRaw('LOWER(name) = ?', [strtolower((string) $this->input('name'))])
                ->when($categoryId, fn ($query) => $query->where('id', '!=', $categoryId))
                ->exists();

            if ($duplicate) {
                $validator->errors()->add('name', 'A category with this name already exists.');
            }
        });
    }
}
