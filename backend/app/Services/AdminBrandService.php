<?php

namespace App\Services;

use App\Models\Brand;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class AdminBrandService
{
    public function __construct(
        private readonly AdminBrandPresenter $presenter,
    ) {}

    public function index(array $filters): array
    {
        $query = Brand::query()->withCount('products');
        $this->applyFilters($query, $filters);

        $brands = $query
            ->orderBy('name')
            ->paginate((int) ($filters['per_page'] ?? 10));

        return [
            'brands' => $brands->getCollection()
                ->map(fn (Brand $brand): array => $this->presenter->brand($brand))
                ->values(),
            'meta' => $this->paginationMeta($brands),
        ];
    }

    public function create(array $attributes): Brand
    {
        return Brand::query()->create($attributes)->loadCount('products');
    }

    public function update(Brand $brand, array $attributes): Brand
    {
        return DB::transaction(function () use ($brand, $attributes): Brand {
            $brand->fill($attributes);
            $brand->save();

            if (array_key_exists('name', $attributes)) {
                Product::query()
                    ->where('brand_id', $brand->id)
                    ->update([
                        'brand' => $brand->name,
                        'updated_at' => now(),
                    ]);
            }

            return $brand->loadCount('products');
        });
    }

    public function delete(Brand $brand): bool
    {
        if ($brand->products()->exists()) {
            return false;
        }

        return (bool) $brand->delete();
    }

    private function applyFilters(Builder $query, array $filters): void
    {
        if (! empty($filters['search'])) {
            $operator = $query->getModel()->getConnection()->getDriverName() === 'pgsql'
                ? 'ilike'
                : 'like';

            $query->where('name', $operator, '%'.trim((string) $filters['search']).'%');
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
    }

    private function paginationMeta($brands): array
    {
        return [
            'current_page' => $brands->currentPage(),
            'last_page' => $brands->lastPage(),
            'per_page' => $brands->perPage(),
            'total' => $brands->total(),
        ];
    }
}
