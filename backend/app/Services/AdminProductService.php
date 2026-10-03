<?php

namespace App\Services;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminProductService
{
    public function __construct(
        private readonly AdminProductPresenter $presenter,
    ) {}

    /** @param array<string, mixed> $filters */
    public function index(array $filters): array
    {
        $query = Product::query()->with([
            'category:id,name,status',
            'brandRecord:id,name,status',
        ]);

        $this->applyFilters($query, $filters);
        $this->applySort($query, (string) ($filters['sort'] ?? 'updated_desc'));

        $products = $query->paginate((int) ($filters['per_page'] ?? 10));

        return [
            'summary' => $this->summary(),
            'filters' => $this->filterOptions(),
            'products' => $products->getCollection()
                ->map(fn (Product $product): array => $this->presenter->product($product))
                ->values(),
            'meta' => $this->paginationMeta($products),
        ];
    }

    public function findByPartNumber(string $partNumber): ?Product
    {
        return Product::query()
            ->with([
                'category:id,name,status',
                'brandRecord:id,name,status',
            ])
            ->where('part_number', $partNumber)
            ->first();
    }

    /** @param array<string, mixed> $attributes */
    public function create(array $attributes): Product
    {
        $attributes = $this->withLegacyBrandName($attributes);

        return Product::query()->create($attributes)->load([
            'category:id,name,status',
            'brandRecord:id,name,status',
        ]);
    }

    /** @param array<string, mixed> $attributes */
    public function update(Product $product, array $attributes): Product
    {
        $attributes = $this->withLegacyBrandName($attributes);
        $product->fill($attributes);
        $product->save();

        return $product->load([
            'category:id,name,status',
            'brandRecord:id,name,status',
        ]);
    }

    public function delete(Product $product): bool
    {
        if ($product->orderItems()->exists()) {
            return false;
        }

        return (bool) $product->delete();
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
            'brands' => Brand::query()
                ->orderBy('name')
                ->pluck('name')
                ->values(),
            'brand_options' => Brand::query()
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (Brand $brand): array => [
                    'id' => $brand->id,
                    'name' => $brand->name,
                ])
                ->values(),
            'categories' => Category::query()
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

    /** @param array<string, mixed> $filters */
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
            $brand = strtolower((string) $filters['brand']);

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
                $categoryQuery->whereRaw('LOWER(name) = ?', [strtolower((string) $filters['category'])]);
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

    private function paginationMeta(LengthAwarePaginator $products): array
    {
        return [
            'current_page' => $products->currentPage(),
            'last_page' => $products->lastPage(),
            'per_page' => $products->perPage(),
            'total' => $products->total(),
        ];
    }

    /** @param array<string, mixed> $attributes */
    private function withLegacyBrandName(array $attributes): array
    {
        if (array_key_exists('brand_id', $attributes)) {
            $attributes['brand'] = Brand::query()->findOrFail($attributes['brand_id'])->name;
        }

        return $attributes;
    }
}
