<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AssistantChatRequest;
use App\Services\Assistant\AldAssistantService;
use App\Services\Assistant\AssistantAbuseGuard;
use App\Services\Assistant\AssistantDailyQuotaGuard;
use App\Services\Assistant\AssistantRateLimitException;
use App\Services\Assistant\AssistantUnavailableException;
use Illuminate\Http\JsonResponse;

class AssistantController extends Controller
{
    public function __construct(
        private readonly AldAssistantService $assistantService,
        private readonly AssistantAbuseGuard $abuseGuard,
        private readonly AssistantDailyQuotaGuard $dailyQuotaGuard,
    ) {}

    public function chat(AssistantChatRequest $request): JsonResponse
    {
        $validated = $request->validated();

        try {
            $this->abuseGuard->assertAllowed($request, $validated['message']);
            $this->dailyQuotaGuard->assertAllowed($request);

            $message = $this->assistantService->chat(
                $validated['message'],
                $validated['history'] ?? [],
            );
        } catch (AssistantRateLimitException $exception) {
            return response()->json([
                'message' => $exception->publicMessage,
                'code' => $exception->errorCode,
                ...($exception->retryAfter === null
                    ? []
                    : ['retryAfter' => $exception->retryAfter]),
            ], 429, $exception->retryAfter === null ? [] : [
                'Retry-After' => (string) $exception->retryAfter,
            ]);
        } catch (AssistantUnavailableException $exception) {
            $status = $exception->reason === 'provider_rate_limited'
                ? 429
                : 503;
            $isProviderBusy = $exception->reason === 'provider_rate_limited';
            $retryAfter = $isProviderBusy ? ($exception->retryAfter ?? 6) : null;

            return response()->json([
                'message' => $exception->publicMessage,
                'code' => $isProviderBusy ? 'assistant_busy' : 'assistant_unavailable',
                ...($retryAfter === null ? [] : ['retryAfter' => $retryAfter]),
            ], $status, $retryAfter === null ? [] : [
                'Retry-After' => (string) $retryAfter,
            ]);
        }

        return response()->json([
            'message' => $message,
        ]);
    }
}
