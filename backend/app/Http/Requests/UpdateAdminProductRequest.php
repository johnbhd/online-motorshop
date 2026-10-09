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

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $currentProduct = Product::query()
            ->select(['id', 'category_id', 'brand_id'])
            ->where('part_number', (string) $this->route('partNumber'))
            ->first();

        $activeOrCurrentCategory = Rule::exists('categories', 'id')->where(function ($query) use ($currentProduct): void {
            $query->where('status', 'active');

            if ($currentProduct?->category_id !== null) {
                $query->orWhere('id', $currentProduct->category_id);
            }
        });
        $activeOrCurrentBrand = Rule::exists('brands', 'id')->where(function ($query) use ($currentProduct): void {
            $query->where('status', 'active');

            if ($currentProduct?->brand_id !== null) {
                $query->orWhere('id', $currentProduct->brand_id);
            }
        });

        return [
            'category_id' => ['sometimes', 'required', 'integer', $activeOrCurrentCategory],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'part_number' => [
                'sometimes', 'required', 'string', 'max:255',
                Rule::unique('products', 'part_number')->ignore($currentProduct?->id),
            ],
            'brand_id' => ['sometimes', 'required', 'integer', $activeOrCurrentBrand],
            'description' => ['sometimes', 'nullable', 'string'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0', 'max:99999999.99'],
            'img_url' => ['sometimes', 'required', 'string', 'max:255'],
            'availability_status' => ['sometimes', 'required', 'string', 'max:100'],
            'status' => ['sometimes', 'required', 'string', 'max:100'],
        ];
    }
}
