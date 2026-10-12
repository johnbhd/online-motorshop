<?php

namespace App\Services\Assistant;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Log;
use Throwable;

class AldCatalogKnowledgeService
{
    public function contextFor(string $message, array $intent): string
    {
        $startedAt = microtime(true);

        try {
            $context = match ($intent['intent'] ?? 'product_search') {
                'brand_list' => $this->brandContext(),
                'category_list' => $this->categoryContext(),
                default => $this->productContext($message, $intent),
            };

            Log::info('ALD Assistant live catalog context retrieved.', [
                'intent' => $intent['intent'] ?? 'unknown',
                'match_count' => $context['match_count'] ?? null,
                'duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
            ]);

            return $this->encodeContext('CURRENT_CATALOG_DATA', $context);
        } catch (AssistantUnavailableException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            Log::error('ALD Assistant live catalog retrieval failed.', [
                'exception' => $exception::class,
                'duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
            ]);

            throw AssistantUnavailableException::unavailable('catalog_unavailable');
        }
    }

    /**
     * @param array{
     *     intent?: string,
     *     search_terms?: array<int, string>,
     *     stock_question?: bool,
     *     compatibility_question?: bool,
     *     specification_question?: bool
     * } $intent
     * @return array{match_count: int, products: array<int, array<string, mixed>>, guardrails: array<int, string>}
     */
    private function productContext(string $message, array $intent): array
    {
        $query = $this->publicProductsQuery();
        $normalizedMessage = mb_strtolower($message, 'UTF-8');
        $brand = $this->findPublicName(Brand::class, $normalizedMessage);
        $category = $this->findPublicName(Category::class, $normalizedMessage);

        if ($brand !== null) {
            $query->where(function (Builder $brandQuery) use ($brand): void {
                $brandQuery
                    ->whereRaw('LOWER(brand) = ?', [mb_strtolower($brand, 'UTF-8')])
                    ->orWhereHas('brandRecord', function (Builder $relationQuery) use ($brand): void {
                        $relationQuery->where('status', 'active')
                            ->whereRaw('LOWER(name) = ?', [mb_strtolower($brand, 'UTF-8')]);
                    });
            });
        }

        if ($category !== null) {
            $query->whereHas('category', function (Builder $categoryQuery) use ($category): void {
                $categoryQuery->where('status', 'active')
                    ->whereRaw('LOWER(name) = ?', [mb_strtolower($category, 'UTF-8')]);
            });
        }

        $terms = $this->termsWithoutMatchedNames(
            $intent['search_terms'] ?? [],
            $brand,
            $category,
        );

        if ($terms !== []) {
            $operator = $query->getModel()->getConnection()->getDriverName() === 'pgsql'
                ? 'ilike'
                : 'like';

            $query->where(function (Builder $searchQuery) use ($terms, $operator): void {
                foreach ($terms as $index => $term) {
                    $pattern = '%'.$term.'%';
                    $method = $index === 0 ? 'where' : 'orWhere';

                    $searchQuery->{$method}(function (Builder $termQuery) use ($operator, $pattern): void {
                        $termQuery->where(function (Builder $fieldQuery) use ($operator, $pattern): void {
                            $fieldQuery
                                ->where('name', $operator, $pattern)
                                ->orWhere('part_number', $operator, $pattern)
                                ->orWhere('description', $operator, $pattern)
                                ->orWhere('brand', $operator, $pattern);
                        })->orWhereHas('category', function (Builder $categoryQuery) use ($operator, $pattern): void {
                            $categoryQuery->where('status', 'active')
                                ->where('name', $operator, $pattern);
                        });
                    });
                }
            });
        }

        $matchCount = (clone $query)->count();
        $maxProducts = max(1, (int) config('assistant.catalog_max_products', 12));
        $products = $query->orderBy('name')->orderBy('id')
            ->limit($maxProducts)
            ->get()
            ->map(fn (Product $product): array => $this->publicProduct($product))
            ->values()
            ->all();

        $guardrails = [];

        if (($intent['stock_question'] ?? false) === true) {
            $guardrails[] = 'Live stock quantities and branch inventory are not stored in the current system.';
        }

        if (($intent['compatibility_question'] ?? false) === true) {
            $guardrails[] = 'Compatibility is not verified by the current catalog; recommend ALD Staff confirmation.';
        }

        if (($intent['specification_question'] ?? false) === true) {
            $guardrails[] = 'Only fields present in each returned public Product record may be described as specifications.';
        }

        return [
            'match_count' => $matchCount,
            'products' => $products,
            'guardrails' => $guardrails,
            'no_match_message' => $matchCount === 0
                ? 'No matching Product was found in the current ALD catalog.'
                : null,
        ];
    }

    /**
     * @return array{brands: array<int, array{name: string}>, match_count: int}
     */
    private function brandContext(): array
    {
        $brands = Brand::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['name'])
            ->map(fn (Brand $brand): array => ['name' => (string) $brand->name])
            ->values()
            ->all();

        return [
            'brands' => $brands,
            'match_count' => count($brands),
            'no_match_message' => $brands === []
                ? 'No active brands were found in the current ALD catalog.'
                : null,
        ];
    }

    /**
     * @return array{categories: array<int, array{name: string, description: ?string}>, match_count: int}
     */
    private function categoryContext(): array
    {
        $categories = Category::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['name', 'description'])
            ->map(fn (Category $category): array => [
                'name' => (string) $category->name,
                'description' => $category->description,
            ])
            ->values()
            ->all();

        return [
            'categories' => $categories,
            'match_count' => count($categories),
            'no_match_message' => $categories === []
                ? 'No active categories were found in the current ALD catalog.'
                : null,
        ];
    }

    private function publicProductsQuery(): Builder
    {
        return Product::query()
            ->where('status', 'active')
            ->whereHas('category', fn (Builder $query) => $query->where('status', 'active'))
            ->where(function (Builder $query): void {
                $query->whereNull('brand_id')
                    ->orWhereHas('brandRecord', fn (Builder $brandQuery) => $brandQuery->where('status', 'active'));
            })
            ->with([
                'category:id,name,description,status',
                'brandRecord:id,name,status',
            ]);
    }

    /**
     * @param  array<int, string>  $terms
     * @return array<int, string>
     */
    private function termsWithoutMatchedNames(array $terms, ?string $brand, ?string $category): array
    {
        $matchedTokens = collect([$brand, $category])
            ->filter()
            ->flatMap(fn (string $value): array => preg_split('/\s+/u', mb_strtolower($value, 'UTF-8')) ?: [])
            ->values()
            ->all();

        return array_values(array_filter(
            $terms,
            fn (string $term): bool => ! in_array(mb_strtolower($term, 'UTF-8'), $matchedTokens, true),
        ));
    }

    private function findPublicName(string $model, string $message): ?string
    {
        return $model::query()
            ->where('status', 'active')
            ->orderByRaw('LENGTH(name) DESC')
            ->pluck('name')
            ->first(fn (string $name): bool => str_contains(
                $message,
                mb_strtolower($name, 'UTF-8'),
            ));
    }

    /**
     * @return array<string, mixed>
     */
    private function publicProduct(Product $product): array
    {
        $description = is_string($product->description)
            ? trim($product->description)
            : null;
        $maxDescriptionCharacters = max(
            0,
            (int) config('assistant.catalog_max_description_characters', 500),
        );

        if ($description !== null && mb_strlen($description, 'UTF-8') > $maxDescriptionCharacters) {
            $description = mb_substr($description, 0, $maxDescriptionCharacters, 'UTF-8')
                .' [Description truncated.]';
        }

        return [
            'name' => (string) $product->name,
            'product_code' => (string) $product->part_number,
            'price' => (float) $product->price,
            'brand' => $product->brandRecord?->name ?? $product->brand,
            'category' => $product->category?->name,
            'description' => $description,
        ];
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function encodeContext(string $source, array $context): string
    {
        $encoded = json_encode(
            [
                'source' => $source,
                'data' => $context,
            ],
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE,
        );

        if (! is_string($encoded)) {
            throw AssistantUnavailableException::unavailable('catalog_unavailable');
        }

        return $encoded;
    }
}
