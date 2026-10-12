<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAdminProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    protected function prepareForValidation(): void
    {
        $this->mergeTrimmedStrings();
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'category_id' => ['required', 'integer', Rule::exists('categories', 'id')->where('status', 'active')],
            'name' => ['required', 'string', 'max:255'],
            'part_number' => ['required', 'string', 'max:255', 'unique:products,part_number'],
            'brand_id' => ['required', 'integer', Rule::exists('brands', 'id')->where('status', 'active')],
            'description' => ['sometimes', 'nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'img_url' => ['required_without:image', 'nullable', 'string', 'max:255'],
            'image' => ['sometimes', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:15360'],
            'availability_status' => ['required', 'string', 'max:100'],
            'status' => ['required', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'image.image' => 'Product image must be a valid image.',
            'image.mimes' => 'Product image must be a JPG, JPEG, PNG, or WEBP image.',
            'image.max' => 'Product image must be 15 MB or smaller.',
        ];
    }

    private function mergeTrimmedStrings(): void
    {
        $values = [];

        foreach (['name', 'part_number', 'description', 'img_url', 'availability_status', 'status'] as $field) {
            if ($this->has($field) && is_string($this->input($field))) {
                $values[$field] = trim((string) $this->input($field));
            }
        }

        if (($values['description'] ?? null) === '') {
            $values['description'] = null;
        }

        $this->merge($values);
    }
}
