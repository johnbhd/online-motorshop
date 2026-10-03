<?php

namespace App\Http\Requests;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAdminProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    protected function prepareForValidation(): void
    {
        $values = [];

        foreach (['name', 'part_number', 'brand', 'description', 'img_url', 'availability_status', 'status'] as $field) {
            if ($this->has($field) && is_string($this->input($field))) {
                $values[$field] = trim((string) $this->input($field));
            }
        }

        if (($values['description'] ?? null) === '') {
            $values['description'] = null;
        }

        $this->merge($values);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $currentProductId = Product::query()
            ->where('part_number', (string) $this->route('partNumber'))
            ->value('id');

        return [
            'category_id' => ['sometimes', 'required', 'integer', 'exists:categories,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'part_number' => [
                'sometimes', 'required', 'string', 'max:255',
                Rule::unique('products', 'part_number')->ignore($currentProductId),
            ],
            'brand' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0', 'max:99999999.99'],
            'img_url' => ['sometimes', 'required', 'string', 'max:255'],
            'availability_status' => ['sometimes', 'required', 'string', 'max:100'],
            'status' => ['sometimes', 'required', 'string', 'max:100'],
        ];
    }
}
