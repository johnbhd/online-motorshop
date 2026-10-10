<?php

namespace App\Services\Assistant;

use Illuminate\Support\Facades\Log;

class AldKnowledgeService
{
    private const MAX_CONTEXT_CHARACTERS = 32000;

    private const MAX_FILE_CHARACTERS = 9000;

    /** @var array<int, string> */
    private const CORE_FILES = [
        'ald-ai-rules.md',
        'ald-overview.md',
        'ald-order-process.md',
        'ald-payment.md',
        'ald-pickup-delivery.md',
        'ald-faq.md',
    ];

    /** @var array<string, array<int, string>> */
    private const TOPIC_FILES = [
        'ald-branches-contact.md' => [
            'branch', 'branches', 'location', 'address', 'contact', 'phone',
            'hours', 'open', 'where are you', 'where is',
        ],
        'ald-team.md' => [
            'owner', 'founder', 'creator', 'developer', 'team', 'jb',
            'who made', 'who built',
        ],
        'ald-products.md' => [
            'product', 'brake', 'filter', 'honda', 'yamaha', 'suzuki',
            'part number', 'parts',
        ],
        'ald-product-compatibility.md' => [
            'compatible', 'compatibility', 'fit', 'fitment', 'model',
            'year', 'will this fit',
        ],
        'ald-services.md' => [
            'service', 'repair', 'mechanic', 'maintenance', 'install',
        ],
        'ald-order-statuses.md' => [
            'status', 'pending', 'confirmed', 'completed', 'rejected',
            'cancelled', 'cancel',
        ],
        'ald-customer-accounts.md' => [
            'account', 'register', 'login', 'sign up', 'guest', 'password',
            'track order',
        ],
    ];

    public function contextFor(string $message): string
    {
        $normalizedMessage = mb_strtolower($message);
        $files = self::CORE_FILES;

        foreach (self::TOPIC_FILES as $file => $keywords) {
            if ($this->containsKeyword($normalizedMessage, $keywords)) {
                $files[] = $file;
            }
        }

        $files = array_values(array_unique($files));
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

        if (mb_strlen($context) > self::MAX_CONTEXT_CHARACTERS) {
            $context = mb_substr($context, 0, self::MAX_CONTEXT_CHARACTERS)
                ."\n\n[Approved knowledge context truncated for safety.]";
        }

        return $context;
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

        if (mb_strlen($content) > self::MAX_FILE_CHARACTERS) {
            $content = mb_substr($content, 0, self::MAX_FILE_CHARACTERS)
                ."\n[This knowledge document was truncated.]";
        }

        return $content;
    }
}
