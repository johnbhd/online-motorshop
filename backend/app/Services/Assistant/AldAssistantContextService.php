<?php

namespace App\Services\Assistant;

class AldAssistantContextService
{
    public function __construct(
        private readonly AldCatalogIntentResolver $intentResolver,
        private readonly AldCatalogKnowledgeService $catalogKnowledgeService,
        private readonly AldBranchKnowledgeService $branchKnowledgeService,
        private readonly AldKnowledgeService $knowledgeService,
    ) {}

    public function contextFor(string $message): ?string
    {
        $intent = $this->intentResolver->resolve($message);

        if (! $intent['is_catalog']) {
            return $this->knowledgeService->contextFor($message);
        }

        $liveContext = str_starts_with($intent['intent'], 'branch_')
            ? $this->branchKnowledgeService->contextFor($intent)
            : $this->catalogKnowledgeService->contextFor($message, $intent);
        $businessContext = $this->knowledgeService->contextFor($message);

        if ($businessContext === null) {
            return $liveContext;
        }

        return $liveContext."\n\nBUSINESS_RULES\n".$businessContext;
    }
}
