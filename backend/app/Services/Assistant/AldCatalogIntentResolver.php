<?php

namespace App\Services\Assistant;

class AldCatalogIntentResolver
{
    public function __construct(
        private readonly ?AldCatalogSearchNormalizer $searchNormalizer = null,
    ) {}

    /**
     * @return array{
     *     intent: string,
     *     is_catalog: bool,
     *     search_terms: array<int, string>,
     *     follow_up: bool,
     *     stock_question: bool,
     *     compatibility_question: bool,
     *     specification_question: bool
     * }
     */
    public function resolve(string $message): array
    {
        $searchNormalizer = $this->searchNormalizer ?? new AldCatalogSearchNormalizer;
        $normalized = $searchNormalizer->normalize($message);
        $searchTerms = $searchNormalizer->searchTerms($message);
        $followUp = $this->matchesPattern($normalized, [
            '/\bhow\s+about\s+(?:now|that|this)\b/u',
            '/\bwhat\s+about\s+(?:now|that|this)\b/u',
            '/\b(?:the\s+)?(?:first|second|third|fourth|last|other)\s+one\b/u',
            '/\bthat\s+one\b/u',
            '/\bthe\s+other\s+one\b/u',
        ]);
        $countQuestion = $this->matchesPattern($normalized, [
            '/\bhow\s+many\s+(?:products?|items?|parts?)\b/u',
            '/\b(?:product|item|part|catalog)\s+count\b/u',
            '/\bwhat\s+(?:is|s)\s+(?:the\s+)?(?:current\s+)?(?:product|item|part|catalog)\s+count\b/u',
            '/\b(?:ilan|ilang)\s+(?:lahat\s+ng\s+|ang\s+)?(?:products?|items?|parts?)\b/u',
            '/\bgaano\s+karami\s+(?:ang\s+)?(?:products?|items?|parts?)\b/u',
            '/\bilan\s+(?:ang\s+)?(?:products?|items?|parts?)\s+(?:sa\s+)?(?:catalog|niyo|nyo|ninyo)\b/u',
        ]);
        $listQuestion = $this->matchesPattern($normalized, [
            '/\bwhat\s+(?:products?|items?|parts?)\s+(?:do\s+you\s+)?(?:have|sell|carry)\b/u',
            '/\bwhat\s+do\s+you\s+sell\b/u',
            '/\bwhat\s+do\s+you\s+(?:have|carry)\b/u',
            '/\bdo\s+you\s+know\s+(?:any\s+)?(?:products?|items?|parts?)\b/u',
            '/\bshow\s+(?:me\s+)?(?:your\s+)?(?:products?|items?|parts?)\b/u',
            '/\bshow\s+me\s+what\s+you\s+have\b/u',
            '/\btell\s+me\s+about\s+(?:your\s+)?(?:products?|items?|parts?|catalog|selection|inventory)\b/u',
            '/\bcan\s+i\s+see\s+(?:your\s+)?(?:catalog|products?|items?|parts?)\b/u',
            '/\bwhat\s+(?:products?|items?|parts?)\s+do\s+you\s+offer\b/u',
            '/\bwhat\s+kind\s+of\s+(?:products?|items?|parts?)\b/u',
            '/\bgive\s+me\s+(?:some\s+)?(?:products?|items?|parts?)\b/u',
            '/\bwhat\s+can\s+i\s+buy\s+(?:here|from\s+you)\b/u',
            '/\b(?:browse|list)\s+(?:your\s+)?(?:products?|items?|parts?)\b/u',
            '/\b(?:products?|items?)\s+(?:are\s+)?available\b/u',
            '/\b(?:ano|anong)\s+(?:mga\s+)?(?:products?|items?|parts?)\s+(?:niyo|nyo|ninyo|kayo)\b/u',
            '/\b(?:ano|anong)\s+(?:ang\s+)?(?:binebenta|benta|tinda(?:ng)?)\b/u',
            '/\b(?:ano|anong)\s+meron\s+(?:kayo|sa\s+inyo)\b/u',
        ]);
        $stockQuestion = $this->containsAny($normalized, [
            'stock', 'in stock', 'available today', 'available now', 'how many left',
            'remaining', 'quantity', 'inventory',
        ]);
        $compatibilityQuestion = $this->containsAny($normalized, [
            'compatible', 'compatibility', 'fit', 'fitment', 'will this fit',
            'does this fit', 'para sa', 'para dito', 'kasya', 'pwede sa',
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
        $genericCatalogSignal = $this->containsAny($normalized, [
            'product', 'products', 'item', 'items', 'part', 'parts', 'catalog',
            'selection', 'inventory', 'thing', 'things', 'meron', 'benta',
            'binebenta', 'nagbebenta', 'tinda',
        ]);
        $specificProductSignal = $this->containsAny($normalized, [
            'battery', 'batteries', 'brake', 'filter', 'oil', 'spark plug',
            'gasket', 'bearing', 'chain', 'sprocket', 'clutch', 'belt', 'tire',
            'tyre', 'wheel', 'shock', 'fork', 'bulb', 'switch', 'accessory',
            'accessories', 'maintenance', 'engine', 'suspension', 'transmission',
            'body', 'panel', 'fairing', 'price', 'code', 'sku',
        ]) || $searchNormalizer->hasKnownProductConcept($normalized);
        $productRequestSignal = $this->matchesPattern($normalized, [
            '/\bdo\s+you\s+(?:have|sell|carry)\b/u',
            '/\b(?:show|find)\b/u',
            '/\blooking\s+for\b/u',
            '/\bcan\s+you\s+(?:show|find)\b/u',
            '/\b(?:may|meron)\b/u',
            '/\b(?:pakita|ipakita)\b/u',
            '/\b(?:ano|anong)\s+\S+\s+(?:products?|items?|parts?)\b/u',
        ]);
        $hasMeaningfulTerms = $searchTerms !== [];

        if ($branchSignal && ! $brandList && ! $categoryList) {
            return [
                'intent' => $branchList ? 'branch_list' : 'branch_details',
                'is_catalog' => true,
                'search_terms' => $searchTerms,
                'follow_up' => false,
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
                'follow_up' => false,
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
                'follow_up' => false,
                'stock_question' => false,
                'compatibility_question' => false,
                'specification_question' => false,
            ];
        }

        if ($countQuestion || ($followUp && $this->matchesPattern($normalized, [
            '/\b(?:how|what)\s+about\s+now\b/u',
        ]))) {
            return [
                'intent' => 'catalog_count',
                'is_catalog' => true,
                'search_terms' => [],
                'follow_up' => $followUp,
                'stock_question' => false,
                'compatibility_question' => false,
                'specification_question' => false,
            ];
        }

        if ($listQuestion && ! ($hasMeaningfulTerms && $productRequestSignal)) {
            return [
                'intent' => 'catalog_list',
                'is_catalog' => true,
                'search_terms' => [],
                'follow_up' => $followUp,
                'stock_question' => false,
                'compatibility_question' => false,
                'specification_question' => false,
            ];
        }

        if (
            ($genericCatalogSignal && ! $hasMeaningfulTerms && ! $stockQuestion && ! $compatibilityQuestion && ! $specificationQuestion)
            || (
                $productRequestSignal
                && ! $hasMeaningfulTerms
                && ! $specificProductSignal
                && ! $stockQuestion
                && ! $compatibilityQuestion
                && ! $specificationQuestion
            )
        ) {
            return [
                'intent' => 'catalog_list',
                'is_catalog' => true,
                'search_terms' => [],
                'follow_up' => $followUp,
                'stock_question' => false,
                'compatibility_question' => false,
                'specification_question' => false,
            ];
        }

        if (
            $followUp
            || $specificProductSignal
            || ($productRequestSignal && $hasMeaningfulTerms)
            || $stockQuestion
            || $compatibilityQuestion
            || $specificationQuestion
        ) {
            return [
                'intent' => $followUp ? 'specific_product' : 'product_search',
                'is_catalog' => true,
                'search_terms' => $followUp ? [] : $searchTerms,
                'follow_up' => $followUp,
                'stock_question' => $stockQuestion,
                'compatibility_question' => $compatibilityQuestion,
                'specification_question' => $specificationQuestion,
            ];
        }

        return [
            'intent' => 'general_help',
            'is_catalog' => false,
            'search_terms' => [],
            'follow_up' => false,
            'stock_question' => false,
            'compatibility_question' => false,
            'specification_question' => false,
        ];
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
