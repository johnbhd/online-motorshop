<?php

namespace App\Services;

use App\Models\Product;

class AdminProductPresenter
{
    /**
     * @return array<string, mixed>
     */
    public function product(Product $product): array
    {
        return [
            'id' => $product->id,
            'part_number' => $product->part_number,
            'name' => $product->name,
            'description' => $product->description,
            'brand' => $product->brand,
            'category_id' => $product->category_id,
            'category' => $product->category?->name,
            'price' => (float) $product->price,
            'img_url' => $product->img_url,
            'availability_status' => $product->availability_status,
            'status' => $product->status,
            'created_at' => $product->created_at?->toISOString(),
            'updated_at' => $product->updated_at?->toISOString(),
        ];
    }
}
