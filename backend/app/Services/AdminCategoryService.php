<?php

namespace App\Services;

use App\Models\Category;
use Illuminate\Database\Eloquent\Builder;

class AdminCategoryService
{
    public function __construct(
        private readonly AdminCategoryPresenter $presenter,
        private readonly AdminArchiveService $archiveService,
    ) {}

    public function index(array $filters): array
    {
        $query = $this->archiveService->excludeArchived(Category::query(), 'category')->withCount('products');
        $this->applyFilters($query, $filters);

        $categories = $query
            ->orderBy('name')
            ->paginate((int) ($filters['per_page'] ?? 10));

        return [
            'categories' => $categories->getCollection()
                ->map(fn (Category $category): array => $this->presenter->category($category))
                ->values(),
            'meta' => $this->paginationMeta($categories),
        ];
    }

    public function create(array $attributes): Category
    {
        return Category::query()->create($attributes)->loadCount('products');
    }

    public function find(Category $category): Category
    {
        return $this->archiveService
            ->excludeArchived(Category::query(), 'category')
            ->withCount('products')
            ->findOrFail($category->getKey());
    }

    public function update(Category $category, array $attributes): Category
    {
        $category = $this->find($category);
        $category->fill($attributes);
        $category->save();

        return $category->loadCount('products');
    }

    public function delete(Category $category): bool
    {
        $category = $this->find($category);

        if ($category->products()->exists()) {
            return false;
        }

        return (bool) $category->delete();
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

    private function paginationMeta($categories): array
    {
        return [
            'current_page' => $categories->currentPage(),
            'last_page' => $categories->lastPage(),
            'per_page' => $categories->perPage(),
            'total' => $categories->total(),
        ];
    }
}
