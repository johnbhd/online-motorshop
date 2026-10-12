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
        return $this->resolve($message, $intent)['context'];
    }

    /**
     * Resolve live customer-visible catalog data and the separate UI payload.
     *
     * Product URLs and image URLs are deliberately kept out of the model
     * context. They are returned only as trusted application metadata for the
     * frontend cards.
     *
     * @param  array<string, mixed>  $intent
     * @param  array<int, array<string, mixed>>  $previousProductContext
     * @return array{
     *     context: string,
     *     products: array<int, array<string, mixed>>,
     *     total_matches: int|null,
     *     has_more: bool,
     *     product_result: bool
     * }
     */
    public function resolve(
        string $message,
        array $intent,
        array $previousProductContext = [],
    ): array {
        $startedAt = microtime(true);

        try {
            $context = match ($intent['intent'] ?? 'product_search') {
                'brand_list' => $this->brandContext(),
                'category_list' => $this->categoryContext(),
                default => $this->productContext(
                    $message,
                    $intent,
                    $previousProductContext,
                ),
            };

            $products = $context['ui_products'] ?? [];

            Log::info('ALD Assistant live catalog context retrieved.', [
                'intent' => $intent['intent'] ?? 'unknown',
                'meaningful_terms' => $intent['search_terms'] ?? [],
                'match_count' => $context['match_count'] ?? null,
                'card_count' => count($products),
                'duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
            ]);

            return [
                'context' => $this->encodeContext(
                    'CURRENT_CATALOG_DATA',
                    $this->withoutUiMetadata($context),
                ),
                'products' => $products,
                'total_matches' => isset($context['match_count'])
                    ? (int) $context['match_count']
                    : null,
                'has_more' => (bool) ($context['has_more'] ?? false),
                'product_result' => (bool) ($context['product_result'] ?? false),
            ];
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
    private function productContext(
        string $message,
        array $intent,
        array $previousProductContext = [],
    ): array {
        $query = $this->publicProductsQuery();
        $normalizedMessage = mb_strtolower($message, 'UTF-8');
        $brand = $this->findPublicName(Brand::class, $normalizedMessage);
        $category = $this->findPublicName(Category::class, $normalizedMessage);

        $intentName = (string) ($intent['intent'] ?? 'product_search');
        $isCount = $intentName === 'catalog_count';
        $isList = $intentName === 'catalog_list';
        $followUpProduct = ! $isCount && ($intent['follow_up'] ?? false) === true
            ? $this->followUpProduct($message, $previousProductContext)
            : null;

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

        if ($brand !== null && in_array($intentName, ['product_search', 'specific_product'], true)) {
            $intentName = 'brand_products';
        } elseif ($category !== null && in_array($intentName, ['product_search', 'specific_product'], true)) {
            $intentName = 'category_products';
        }

        if ($followUpProduct !== null) {
            $query->where('part_number', $followUpProduct);
        }

        $terms = $followUpProduct === null
            ? $this->termsWithoutMatchedNames(
                $intent['search_terms'] ?? [],
                $brand,
                $category,
            )
            : [];

        if ($terms !== [] && ! $isCount && ! $isList) {
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
                        })->orWhereHas('brandRecord', function (Builder $brandQuery) use ($operator, $pattern): void {
                            $brandQuery->where('status', 'active')
                                ->where('name', $operator, $pattern);
                        });
                    });
                }
            });
        }

        $matchCount = (clone $query)->count();
        $maxProducts = min(5, max(1, (int) config('assistant.catalog_max_products', 5)));
        $visibleProducts = $isCount
            ? collect()
            : $query->orderBy('name')->orderBy('id')
                ->limit($maxProducts)
                ->get();
        $products = $visibleProducts
            ->map(fn (Product $product): array => $this->publicProduct($product))
            ->values()
            ->all();
        $uiProducts = $visibleProducts
            ->map(fn (Product $product): array => $this->publicProductCard($product))
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
            'ui_products' => $uiProducts,
            'product_result' => ! $isCount,
            'has_more' => ! $isCount && $matchCount > count($uiProducts),
            'intent' => $intentName,
            'guardrails' => $guardrails,
            'no_match_message' => $matchCount === 0
                ? ($isList
                    ? 'No public Products are currently listed in the ALD catalog.'
                    : 'No matching Product was found in the current ALD catalog.')
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
            ->select([
                'id',
                'category_id',
                'brand_id',
                'name',
                'part_number',
                'brand',
                'description',
                'price',
                'img_url',
                'status',
            ])
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
     * @return array<string, mixed>
     */
    private function publicProductCard(Product $product): array
    {
        $imageUrl = is_string($product->img_url) ? trim($product->img_url) : '';

        $imageScheme = strtolower((string) parse_url($imageUrl, PHP_URL_SCHEME));

        if (! filter_var($imageUrl, FILTER_VALIDATE_URL)
            || ! in_array($imageScheme, ['http', 'https'], true)) {
            $imageUrl = null;
        }

        return [
            'name' => (string) $product->name,
            'product_code' => (string) $product->part_number,
            'product_url' => '/products/'.rawurlencode((string) $product->part_number),
            'image_url' => $imageUrl,
            'price' => is_numeric($product->price) ? (float) $product->price : null,
            'brand' => $product->brandRecord?->name ?? $product->brand,
            'category' => $product->category?->name,
            'description' => $this->publicDescription($product->description),
        ];
    }

    private function publicDescription(mixed $description): ?string
    {
        $description = is_string($description) ? trim($description) : null;
        $maxDescriptionCharacters = max(
            0,
            (int) config('assistant.catalog_max_description_characters', 500),
        );

        if ($description !== null && mb_strlen($description, 'UTF-8') > $maxDescriptionCharacters) {
            return mb_substr($description, 0, $maxDescriptionCharacters, 'UTF-8')
                .' [Description truncated.]';
        }

        return $description;
    }

    /**
     * @param  array<int, array<string, mixed>>  $previousProductContext
     */
    private function followUpProduct(string $message, array $previousProductContext): ?string
    {
        if ($previousProductContext === []) {
            return null;
        }

        $normalized = mb_strtolower($message, 'UTF-8');
        $index = null;

        foreach ([
            'first' => 0,
            'second' => 1,
            'third' => 2,
            'fourth' => 3,
            'last' => count($previousProductContext) - 1,
        ] as $ordinal => $ordinalIndex) {
            if (str_contains($normalized, $ordinal)) {
                $index = $ordinalIndex;
                break;
            }
        }

        if ($index === null && preg_match('/\b(?:that|this|the other)\s+one\b/u', $normalized) === 1) {
            $index = 0;
        }

        if ($index === null || ! isset($previousProductContext[$index])) {
            return null;
        }

        $productCode = $previousProductContext[$index]['product_code']
            ?? $previousProductContext[$index]['part_number']
            ?? null;

        return is_string($productCode) && trim($productCode) !== ''
            ? trim($productCode)
            : null;
    }

    /**
     * UI-only metadata must never be copied into the model context.
     *
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    private function withoutUiMetadata(array $context): array
    {
        unset($context['ui_products']);

        return $context;
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
