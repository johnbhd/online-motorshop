<?php

namespace App\Services;

use App\Models\Category;

class AdminCategoryPresenter
{
    public function category(Category $category): array
    {
        return [
            'id' => $category->id,
            'name' => $category->name,
            'description' => $category->description,
            'status' => $category->status,
            'product_count' => $category->products_count ?? $category->products()->count(),
            'created_at' => $category->created_at?->toISOString(),
            'updated_at' => $category->updated_at?->toISOString(),
        ];
    }
}
