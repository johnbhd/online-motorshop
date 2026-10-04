<?php

namespace App\Services;

use App\Models\Brand;

class AdminBrandPresenter
{
    public function brand(Brand $brand): array
    {
        return [
            'id' => $brand->id,
            'name' => $brand->name,
            'description' => $brand->description,
            'status' => $brand->status,
            'product_count' => $brand->products_count ?? $brand->products()->count(),
            'created_at' => $brand->created_at?->toISOString(),
            'updated_at' => $brand->updated_at?->toISOString(),
        ];
    }
}
