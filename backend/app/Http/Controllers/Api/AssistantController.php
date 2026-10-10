<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AssistantChatRequest;
use App\Services\Assistant\AldAssistantService;
use App\Services\Assistant\AssistantUnavailableException;
use Illuminate\Http\JsonResponse;

class AssistantController extends Controller
{
    public function __construct(
        private readonly AldAssistantService $assistantService,
    ) {}

    public function chat(AssistantChatRequest $request): JsonResponse
    {
        $validated = $request->validated();

        try {
            $message = $this->assistantService->chat(
                $validated['message'],
                $validated['history'] ?? [],
            );
        } catch (AssistantUnavailableException $exception) {
            $status = $exception->reason === 'provider_rate_limited'
                ? 429
                : 503;

            return response()->json([
                'message' => $exception->publicMessage,
            ], $status, $status === 429 ? [
                'Retry-After' => '30',
            ] : []);
        }

        return response()->json([
            'message' => $message,
        ]);
    }
}
