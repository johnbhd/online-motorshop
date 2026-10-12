<?php

namespace App\Services\Assistant;

class AldAssistantContextService
{
    /**
     * @var array{
     *     is_catalog: bool,
     *     product_result: bool,
     *     products: array<int, array<string, mixed>>,
     *     total_matches: int|null,
     *     has_more: bool
     * }
     */
    private array $lastMetadata = [
        'is_catalog' => false,
        'product_result' => false,
        'products' => [],
        'total_matches' => null,
        'has_more' => false,
    ];

    public function __construct(
        private readonly AldCatalogIntentResolver $intentResolver,
        private readonly AldCatalogKnowledgeService $catalogKnowledgeService,
        private readonly AldBranchKnowledgeService $branchKnowledgeService,
        private readonly AldKnowledgeService $knowledgeService,
    ) {}

    public function contextFor(string $message): ?string
    {
        return $this->resolve($message)['context'];
    }

    /**
     * Use bounded product metadata from the recent frontend history for safe
     * follow-up questions such as "how much is the second one?".
     *
     * @param  array<int, array<string, mixed>>  $history
     */
    public function contextForWithHistory(string $message, array $history): ?string
    {
        return $this->resolve($message, $this->previousProductContext($history))['context'];
    }

    /**
     * @return array{
     *     context: string|null,
     *     is_catalog: bool,
     *     product_result: bool,
     *     products: array<int, array<string, mixed>>,
     *     total_matches: int|null,
     *     has_more: bool
     * }
     */
    private function resolve(string $message, array $previousProductContext = []): array
    {
        $intent = $this->intentResolver->resolve($message);

        if (! $intent['is_catalog']) {
            $context = $this->knowledgeService->contextFor($message);
            $this->lastMetadata = [
                'is_catalog' => false,
                'product_result' => false,
                'products' => [],
                'total_matches' => null,
                'has_more' => false,
            ];

            return [
                'context' => $context,
                ...$this->lastMetadata,
            ];
        }

        $catalogResult = str_starts_with($intent['intent'], 'branch_')
            ? null
            : $this->catalogKnowledgeService->resolve(
                $message,
                $intent,
                $previousProductContext,
            );
        $liveContext = str_starts_with($intent['intent'], 'branch_')
            ? $this->branchKnowledgeService->contextFor($intent)
            : $catalogResult['context'];
        $businessContext = $this->knowledgeService->contextFor($message);

        $this->lastMetadata = [
            'is_catalog' => true,
            'product_result' => (bool) ($catalogResult['product_result'] ?? false),
            'products' => $catalogResult['products'] ?? [],
            'total_matches' => $catalogResult['total_matches'] ?? null,
            'has_more' => (bool) ($catalogResult['has_more'] ?? false),
        ];

        if ($businessContext === null) {
            return [
                'context' => $liveContext,
                ...$this->lastMetadata,
            ];
        }

        return [
            'context' => $liveContext."\n\nBUSINESS_RULES\n".$businessContext,
            ...$this->lastMetadata,
        ];
    }

    /**
     * @return array{
     *     is_catalog: bool,
     *     product_result: bool,
     *     products: array<int, array<string, mixed>>,
     *     total_matches: int|null,
     *     has_more: bool
     * }
     */
    public function metadata(): array
    {
        return $this->lastMetadata;
    }

    /**
     * @param  array<int, array<string, mixed>>  $history
     * @return array<int, array<string, mixed>>
     */
    private function previousProductContext(array $history): array
    {
        foreach (array_reverse($history) as $turn) {
            if (! is_array($turn) || ($turn['role'] ?? null) !== 'assistant') {
                continue;
            }

            $products = $turn['product_context'] ?? [];

            if (is_array($products)) {
                return array_values(array_filter(
                    $products,
                    static fn (mixed $product): bool => is_array($product),
                ));
            }
        }

        return [];
    }
}
