<?php

namespace App\Services\Assistant;

use Illuminate\Support\Facades\Log;

class AldKnowledgeService
{
    /** @var array<string, array<int, string>> */
    private const TOPIC_FILES = [
        'ald-order-process.md' => [
            'order', 'checkout', 'cart', 'order request', 'submit',
            'how do i order', 'how to order',
        ],
        'ald-pickup-delivery.md' => [
            'delivery', 'deliver', 'lalamove', 'rider', 'pickup', 'pick up',
            'collection',
        ],
        'ald-payment.md' => [
            'payment', 'pay', 'gcash', 'online payment', 'qr', 'receipt',
        ],
        'ald-branches-contact.md' => [
            'branch', 'branches', 'location', 'address', 'contact', 'phone',
            'hours', 'open', 'where are you', 'where is', 'makati', 'manila',
            'imus',
        ],
        'ald-products.md' => [
            'product', 'brake', 'filter', 'honda', 'yamaha', 'suzuki',
            'part number', 'parts', 'sell', 'benta', 'binebenta', 'catalog',
        ],
        'ald-product-compatibility.md' => [
            'compatible', 'compatibility', 'fit', 'fitment', 'model',
            'year', 'will this fit',
        ],
        'ald-order-statuses.md' => [
            'status', 'pending', 'confirmed', 'completed', 'rejected',
            'cancelled', 'cancel',
        ],
        'ald-customer-accounts.md' => [
            'account', 'register', 'login', 'sign up', 'guest', 'password',
            'track order',
        ],
        'ald-team.md' => [
            'owner', 'founder', 'creator', 'developer', 'team', 'jb',
            'who made', 'who built', 'who developed',
        ],
        'ald-services.md' => [
            'service', 'repair', 'mechanic', 'maintenance', 'install',
        ],
        'ald-overview.md' => [
            'what is ald', 'ald motorshop', 'motorcycle shop', 'motorcycle parts',
        ],
    ];

    public function contextFor(string $message): ?string
    {
        $normalizedMessage = mb_strtolower($message);
        $files = $this->selectedFiles($normalizedMessage);

        if ($files === []) {
            return null;
        }

        $documents = [];

        foreach ($files as $file) {
            $content = $this->readDocument($file);

            if ($content === null) {
                continue;
            }

            $documents[] = "## Approved context: {$file}\n{$content}";
        }

        if ($documents === []) {
            Log::error('No ALD Assistant knowledge documents could be loaded.');

            throw AssistantUnavailableException::unavailable('knowledge_unavailable');
        }

        $context = implode("\n\n", $documents);

        $maxContextCharacters = (int) config(
            'assistant.max_knowledge_context_characters',
            12000,
        );

        if (mb_strlen($context) > $maxContextCharacters) {
            $context = mb_substr($context, 0, $maxContextCharacters)
                ."\n\n[Approved knowledge context truncated for safety.]";
        }

        return $context;
    }

    /**
     * @return array<int, string>
     */
    private function selectedFiles(string $message): array
    {
        $files = [];

        foreach (self::TOPIC_FILES as $file => $keywords) {
            if ($this->containsKeyword($message, $keywords)) {
                $files[] = $file;
            }
        }

        $maxDocuments = max(1, (int) config('assistant.max_knowledge_documents', 2));

        return array_slice($files, 0, $maxDocuments);
    }

    /**
     * @param  array<int, string>  $keywords
     */
    private function containsKeyword(string $message, array $keywords): bool
    {
        foreach ($keywords as $keyword) {
            if (str_contains($message, $keyword)) {
                return true;
            }
        }

        return false;
    }

    private function readDocument(string $file): ?string
    {
        $path = resource_path('knowledge/'.$file);

        if (! is_file($path) || ! is_readable($path)) {
            Log::warning('ALD Assistant knowledge document is missing or unreadable.', [
                'file' => $file,
            ]);

            return null;
        }

        $content = file_get_contents($path);

        if (! is_string($content)) {
            Log::warning('ALD Assistant knowledge document could not be read.', [
                'file' => $file,
            ]);

            return null;
        }

        $content = preg_replace('/[ \t]+\n/', "\n", $content) ?? $content;
        $content = preg_replace('/\n{3,}/', "\n\n", $content) ?? $content;
        $content = trim($content);

        $maxFileCharacters = (int) config(
            'assistant.max_knowledge_file_characters',
            6000,
        );

        if (mb_strlen($content) > $maxFileCharacters) {
            $content = mb_substr($content, 0, $maxFileCharacters)
                ."\n[This knowledge document was truncated.]";
        }

        return $content;
    }
}
