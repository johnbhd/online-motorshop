<?php

namespace App\Http\Controllers;

use App\Services\PsgcLocationDataUnavailable;
use App\Services\PsgcLocationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LocationController extends Controller
{
    public function __construct(private readonly PsgcLocationService $service) {}

    public function cities(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['sometimes', 'nullable', 'string', 'max:100'],
        ]);

        try {
            $cities = $this->service->cities($validated['q'] ?? null);

            return response()->json([
                'cities_municipalities' => $cities,
                'meta' => ['total' => count($cities)],
            ]);
        } catch (PsgcLocationDataUnavailable $exception) {
            return $this->unavailable($exception);
        }
    }

    public function barangays(string $code): JsonResponse
    {
        if (! preg_match('/^\d{10}$/', $code)) {
            return response()->json([
                'message' => 'The city or municipality code is invalid.',
            ], 422);
        }

        try {
            $city = $this->service->city($code);

            if ($city === null) {
                return response()->json([
                    'message' => 'City or municipality not found.',
                ], 404);
            }

            return response()->json([
                'city_municipality' => $city,
                'barangays' => $this->service->barangaysForCity($code),
            ]);
        } catch (PsgcLocationDataUnavailable $exception) {
            return $this->unavailable($exception);
        }
    }

    private function unavailable(PsgcLocationDataUnavailable $exception): JsonResponse
    {
        Log::error('PSGC location data is unavailable.', [
            'error' => $exception->getMessage(),
        ]);

        return response()->json([
            'message' => 'Location data is currently unavailable.',
        ], 503);
    }
}
