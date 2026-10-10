<?php

namespace App\Services\Assistant;

class AldAssistantService
{
    public function __construct(
        private readonly AldKnowledgeService $knowledgeService,
        private readonly AldSystemPrompt $systemPrompt,
        private readonly GroqService $groqService,
    ) {}

    /**
     * @param  array<int, array{role: string, content: string}>  $history
     */
    public function chat(string $message, array $history = []): string
    {
        $messages = [
            [
                'role' => 'system',
                'content' => $this->systemPrompt->content(),
            ],
            [
                'role' => 'system',
                'content' => "Approved ALD knowledge context:\n\n"
                    .$this->knowledgeService->contextFor($message),
            ],
            ...$this->historyMessages($history),
            [
                'role' => 'user',
                'content' => trim($message),
            ],
        ];

        return $this->groqService->complete($messages);
    }

    /**
     * @param  array<int, array{role: string, content: string}>  $history
     * @return array<int, array{role: string, content: string}>
     */
    private function historyMessages(array $history): array
    {
        $messages = [];

        foreach (array_slice($history, -10) as $turn) {
            $role = is_array($turn) ? ($turn['role'] ?? null) : null;
            $content = is_array($turn) ? ($turn['content'] ?? null) : null;

            if (! in_array($role, ['user', 'assistant'], true) || ! is_string($content)) {
                continue;
            }

            $content = trim($content);

            if ($content === '') {
                continue;
            }

            $messages[] = [
                'role' => $role,
                'content' => $content,
            ];
        }

        return $messages;
    }
}
