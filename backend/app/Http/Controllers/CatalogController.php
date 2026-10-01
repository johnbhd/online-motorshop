<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CatalogController extends Controller
{
    public function products(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['sometimes', 'string', 'max:100'],
            'brand' => ['sometimes', 'string', 'max:100'],
            'category' => ['sometimes', 'string', 'max:100'],
            'sort' => [
                'sometimes',
                'string',
                Rule::in(['price_asc', 'price_desc']),
            ],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Product::query()
            ->with([
                'category:id,name',
            ])
            ->where('status', 'active');

        if (isset($filters['search'])) {
            $this->applySearch($query, $filters['search']);
        }

        if (isset($filters['brand'])) {
            $query->whereRaw(
                'LOWER(brand) = ?',
                [strtolower($filters['brand'])],
            );
        }

        if (isset($filters['category'])) {
            $query->whereHas('category', function (Builder $categoryQuery) use ($filters): void {
                $categoryQuery->whereRaw(
                    'LOWER(name) = ?',
                    [strtolower($filters['category'])],
                );
            });
        }

        $sort = $filters['sort'] ?? null;

        if ($sort === 'price_asc') {
            $query->orderBy('price');
        } elseif ($sort === 'price_desc') {
            $query->orderByDesc('price');
        }

        $query->orderBy('id');

        $perPage = $filters['per_page'] ?? 50;
        $products = $query->paginate($perPage);

        return response()->json([
            'products' => $products->getCollection()
                ->map(fn (Product $product): array => $this->productPayload($product))
                ->values(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    public function product(string $identifier): JsonResponse
    {
        $product = Product::query()
            ->with([
                'category:id,name',
            ])
            ->where('status', 'active')
            ->where('part_number', $identifier)
            ->first();

        if (! $product) {
            return response()->json([
                'message' => 'Product not found.',
            ], 404);
        }

        return response()->json([
            'product' => $this->productPayload($product),
        ]);
    }

    public function categories(): JsonResponse
    {
        $categories = Category::query()
            ->where('status', 'active')
            ->orderBy('id')
            ->get([
                'id',
                'name',
                'description',
                'status',
            ]);

        return response()->json([
            'categories' => $categories,
        ]);
    }

    public function branches(): JsonResponse
    {
        $branches = Branch::query()
            ->where('status', 'active')
            ->orderBy('id')
            ->get([
                'id',
                'name',
                'address',
                'contact_number',
                'pickup_available',
                'status',
            ]);

        return response()->json([
            'branches' => $branches,
        ]);
    }

    private function applySearch(Builder $query, string $search): void
    {
        $operator = $query->getModel()->getConnection()->getDriverName() === 'pgsql'
            ? 'ilike'
            : 'like';
        $term = "%{$search}%";

        $query->where(function (Builder $searchQuery) use ($operator, $term): void {
            $searchQuery
                ->where('name', $operator, $term)
                ->orWhere('part_number', $operator, $term)
                ->orWhere('description', $operator, $term);
        });
    }

    private function productPayload(Product $product): array
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
        ];
    }
}
