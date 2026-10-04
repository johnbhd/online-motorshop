<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'part_number' => ['required', 'string', 'max:255', 'unique:products,part_number'],
            'brand_id' => ['required', 'integer', 'exists:brands,id'],
            'description' => ['sometimes', 'nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'img_url' => ['required', 'string', 'max:255'],
            'availability_status' => ['required', 'string', 'max:100'],
            'status' => ['required', 'string', 'max:100'],
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
