<?php

namespace App\Services\Assistant;

class AldCatalogIntentResolver
{
    /**
     * @return array{
     *     intent: string,
     *     is_catalog: bool,
     *     search_terms: array<int, string>,
     *     stock_question: bool,
     *     compatibility_question: bool,
     *     specification_question: bool
     * }
     */
    public function resolve(string $message): array
    {
        $normalized = $this->normalize($message);
        $searchTerms = $this->searchTerms($normalized);
        $stockQuestion = $this->containsAny($normalized, [
            'stock', 'in stock', 'available today', 'available now', 'how many left',
            'remaining', 'quantity', 'inventory',
        ]);
        $compatibilityQuestion = $this->containsAny($normalized, [
            'compatible', 'compatibility', 'fit', 'fitment', 'will this fit',
            'does this fit',
        ]);
        $specificationQuestion = $this->containsAny($normalized, [
            'spec', 'specification', 'specifications', 'voltage', 'capacity',
            'dimension', 'dimensions', 'material', 'size',
        ]);
        $brandList = $this->matchesPattern($normalized, [
            '/\bwhat\s+brands?\b/u',
            '/\bwhich\s+brands?\b/u',
            '/\bbrands?\s+(do\s+you\s+carry|are\s+available|do\s+you\s+have)\b/u',
            '/\blist\s+(your\s+)?brands?\b/u',
        ]);
        $categoryList = $this->matchesPattern($normalized, [
            '/\bwhat\s+categories\b/u',
            '/\bwhich\s+categories\b/u',
            '/\bcategories\s+(do\s+you\s+carry|are\s+available|do\s+you\s+have)\b/u',
            '/\blist\s+(your\s+)?categories\b/u',
        ]);
        $branchList = $this->matchesPattern($normalized, [
            '/\bwhat\s+branches\b/u',
            '/\bwhich\s+branches\b/u',
            '/\blist\s+(your\s+)?branches\b/u',
            '/\bwhere\s+are\s+(your\s+)?branches\b/u',
            '/\bwhere\s+are\s+you\s+located\b/u',
            '/\bbranch\s+locations?\b/u',
        ]);
        $branchSignal = $this->containsAny($normalized, [
            'branch', 'branches', 'location', 'locations', 'address', 'addresses',
            'phone', 'contact number', 'hours', 'open', 'where are you',
        ]);
        $productSignal = $this->containsAny($normalized, [
            'product', 'products', 'part', 'parts', 'catalog', 'sell', 'carry',
            'battery', 'batteries', 'brake', 'filter', 'oil', 'spark plug',
            'gasket', 'bearing', 'chain', 'sprocket', 'clutch', 'belt', 'tire',
            'tyre', 'wheel', 'shock', 'fork', 'bulb', 'switch', 'accessory',
            'accessories', 'maintenance', 'engine', 'suspension', 'transmission',
            'body', 'panel', 'fairing', 'price', 'code', 'sku',
        ]);

        if ($branchSignal && ! $brandList && ! $categoryList) {
            return [
                'intent' => $branchList ? 'branch_list' : 'branch_details',
                'is_catalog' => true,
                'search_terms' => $searchTerms,
                'stock_question' => false,
                'compatibility_question' => false,
                'specification_question' => false,
            ];
        }

        if ($brandList) {
            return [
                'intent' => 'brand_list',
                'is_catalog' => true,
                'search_terms' => [],
                'stock_question' => false,
                'compatibility_question' => false,
                'specification_question' => false,
            ];
        }

        if ($categoryList) {
            return [
                'intent' => 'category_list',
                'is_catalog' => true,
                'search_terms' => [],
                'stock_question' => false,
                'compatibility_question' => false,
                'specification_question' => false,
            ];
        }

        if ($productSignal || $stockQuestion || $compatibilityQuestion || $specificationQuestion) {
            return [
                'intent' => 'product_search',
                'is_catalog' => true,
                'search_terms' => $searchTerms,
                'stock_question' => $stockQuestion,
                'compatibility_question' => $compatibilityQuestion,
                'specification_question' => $specificationQuestion,
            ];
        }

        return [
            'intent' => 'general_help',
            'is_catalog' => false,
            'search_terms' => [],
            'stock_question' => false,
            'compatibility_question' => false,
            'specification_question' => false,
        ];
    }

    private function normalize(string $message): string
    {
        $normalized = mb_strtolower(trim($message), 'UTF-8');
        $normalized = preg_replace('/[^\p{L}\p{N}&]+/u', ' ', $normalized) ?? $normalized;

        return trim(preg_replace('/\s+/u', ' ', $normalized) ?? $normalized);
    }

    /**
     * @return array<int, string>
     */
    private function searchTerms(string $normalized): array
    {
        $stopWords = [
            'a', 'about', 'and', 'are', 'do', 'does', 'for', 'have', 'how', 'i',
            'is', 'me', 'my', 'of', 'on', 'please', 'show', 'the', 'this', 'to',
            'what', 'which', 'with', 'you', 'your', 'can', 'could', 'any', 'some',
            'do', 'there', 'in', 'at', 'from', 'sell', 'carry', 'available',
            'product', 'products', 'part', 'parts', 'catalog', 'code', 'sku',
        ];
        $tokens = preg_split('/\s+/u', $normalized, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $terms = [];

        foreach ($tokens as $token) {
            if (mb_strlen($token, 'UTF-8') < 3 || in_array($token, $stopWords, true)) {
                continue;
            }

            $token = match (true) {
                str_ends_with($token, 'ies') && mb_strlen($token, 'UTF-8') > 4 => mb_substr($token, 0, -3, 'UTF-8').'y',
                str_ends_with($token, 's') && mb_strlen($token, 'UTF-8') > 4 => mb_substr($token, 0, -1, 'UTF-8'),
                default => $token,
            };

            if (! in_array($token, $terms, true)) {
                $terms[] = $token;
            }
        }

        return array_slice($terms, 0, 6);
    }

    /**
     * @param  array<int, string>  $needles
     */
    private function containsAny(string $haystack, array $needles): bool
    {
        foreach ($needles as $needle) {
            if (str_contains($haystack, $needle)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  array<int, string>  $patterns
     */
    private function matchesPattern(string $value, array $patterns): bool
    {
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $value) === 1) {
                return true;
            }
        }

        return false;
    }
}
