<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Services\StaffProductPresenter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StaffProductsController extends Controller
{
    public function __construct(
        private readonly StaffProductPresenter $presenter,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
            'brand' => ['sometimes', 'nullable', 'string', 'max:100'],
            'category' => ['sometimes', 'nullable', 'string', 'max:100'],
            'status' => ['sometimes', 'nullable', 'string', 'max:100'],
            'availability_status' => ['sometimes', 'nullable', 'string', 'max:100'],
            'sort' => [
                'sometimes',
                'nullable',
                'string',
                Rule::in([
                    'name_asc',
                    'name_desc',
                    'price_asc',
                    'price_desc',
                    'updated_desc',
                ]),
            ],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Product::query()
            ->with([
                'category:id,name,status',
                'brandRecord:id,name,status',
            ]);

        $this->applyFilters($query, $filters);
        $this->applySort($query, $filters['sort'] ?? 'updated_desc');

        $products = $query->paginate($filters['per_page'] ?? 10);

        return response()->json([
            'summary' => $this->summary(),
            'filters' => $this->filterOptions(),
            'products' => $products->getCollection()
                ->map(fn (Product $product): array => $this->presenter->product($product))
                ->values(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    public function show(string $partNumber): JsonResponse
    {
        $product = Product::query()
            ->with([
                'category:id,name,status',
                'brandRecord:id,name,status',
            ])
            ->where('part_number', $partNumber)
            ->first();

        if (! $product) {
            return response()->json([
                'message' => 'Product not found.',
            ], 404);
        }

        return response()->json([
            'product' => $this->presenter->product($product),
        ]);
    }

    private function applyFilters(Builder $query, array $filters): void
    {
        $search = trim((string) ($filters['search'] ?? ''));

        if ($search !== '') {
            $operator = $query->getModel()->getConnection()->getDriverName() === 'pgsql'
                ? 'ilike'
                : 'like';
            $term = "%{$search}%";

            $query->where(function (Builder $searchQuery) use ($operator, $term): void {
                $searchQuery
                    ->where('name', $operator, $term)
                    ->orWhere('part_number', $operator, $term)
                    ->orWhere('brand', $operator, $term)
                    ->orWhere('description', $operator, $term);
            });
        }

        if (! empty($filters['brand'])) {
            $brand = strtolower($filters['brand']);

            $query->where(function (Builder $brandQuery) use ($brand): void {
                $brandQuery
                    ->whereRaw('LOWER(brand) = ?', [$brand])
                    ->orWhereHas('brandRecord', function (Builder $relationQuery) use ($brand): void {
                        $relationQuery->whereRaw('LOWER(name) = ?', [$brand]);
                    });
            });
        }

        if (! empty($filters['category'])) {
            $query->whereHas('category', function (Builder $categoryQuery) use ($filters): void {
                $categoryQuery->whereRaw(
                    'LOWER(name) = ?',
                    [strtolower($filters['category'])],
                );
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['availability_status'])) {
            $query->where('availability_status', $filters['availability_status']);
        }
    }

    private function applySort(Builder $query, string $sort): void
    {
        match ($sort) {
            'name_asc' => $query->orderBy('name')->orderBy('id'),
            'name_desc' => $query->orderByDesc('name')->orderByDesc('id'),
            'price_asc' => $query->orderBy('price')->orderBy('id'),
            'price_desc' => $query->orderByDesc('price')->orderByDesc('id'),
            default => $query->orderByDesc('updated_at')->orderByDesc('id'),
        };
    }

    private function summary(): array
    {
        $products = Product::query();

        return [
            'total' => (clone $products)->count(),
            'active' => (clone $products)->where('status', 'active')->count(),
            'inactive' => (clone $products)->where('status', '!=', 'active')->count(),
            'inventory_tracked' => false,
        ];
    }

    private function filterOptions(): array
    {
        return [
            'brands' => Product::query()
                ->whereNotNull('brand')
                ->select('brand')
                ->distinct()
                ->orderBy('brand')
                ->pluck('brand')
                ->values(),
            'categories' => Category::query()
                ->whereHas('products')
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (Category $category): array => [
                    'id' => $category->id,
                    'name' => $category->name,
                ])
                ->values(),
            'statuses' => Product::query()
                ->whereNotNull('status')
                ->select('status')
                ->distinct()
                ->orderBy('status')
                ->pluck('status')
                ->values(),
            'availability_statuses' => Product::query()
                ->whereNotNull('availability_status')
                ->select('availability_status')
                ->distinct()
                ->orderBy('availability_status')
                ->pluck('availability_status')
                ->values(),
        ];
    }
}
