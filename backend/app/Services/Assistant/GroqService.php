<?php

namespace App\Services\Assistant;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class GroqService
{
    /**
     * @param  array<int, array{role: string, content: string}>  $messages
     */
    public function complete(array $messages): string
    {
        $key = trim((string) config('services.groq.key', ''));
        $model = trim((string) config('services.groq.model', 'openai/gpt-oss-120b'));
        $baseUrl = rtrim(trim((string) config(
            'services.groq.base_url',
            'https://api.groq.com/openai/v1',
        )), '/');

        if ($key === '' || $model === '' || $baseUrl === '') {
            Log::error('Groq assistant integration is missing required configuration.');

            throw AssistantUnavailableException::notConfigured();
        }

        try {
            $payload = [
                'model' => $model,
                'messages' => $messages,
                'temperature' => 0.3,
                'max_completion_tokens' => (int) config(
                    'assistant.max_completion_tokens',
                    256,
                ),
            ];

            if (in_array($model, config('assistant.reasoning_models', []), true)) {
                $payload['reasoning_effort'] = config(
                    'assistant.reasoning_effort',
                    'low',
                );
            }

            $response = Http::withToken($key)
                ->acceptJson()
                ->asJson()
                ->connectTimeout(10)
                ->timeout(30)
                ->post($baseUrl.'/chat/completions', $payload);
        } catch (ConnectionException $exception) {
            Log::warning('Groq assistant request could not connect.', [
                'exception' => $exception::class,
            ]);

            throw AssistantUnavailableException::unavailable('connection_failure');
        } catch (Throwable $exception) {
            Log::error('Groq assistant request failed before receiving a response.', [
                'exception' => $exception::class,
            ]);

            throw AssistantUnavailableException::unavailable('request_failure');
        }

        if (! $response->successful()) {
            Log::warning('Groq assistant returned a non-success response.', [
                'status' => $response->status(),
            ]);

            throw AssistantUnavailableException::unavailable(
                match ($response->status()) {
                    401, 403 => 'provider_authorization_failure',
                    429 => 'provider_rate_limited',
                    default => 'provider_failure',
                },
            );
        }

        $payload = $response->json();
        $content = is_array($payload)
            ? data_get($payload, 'choices.0.message.content')
            : null;

        if (! is_string($content) || trim($content) === '') {
            Log::warning('Groq assistant returned an empty or malformed completion.');

            throw AssistantUnavailableException::unavailable('malformed_provider_response');
        }

        return trim($content);
    }
}
