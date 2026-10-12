<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReverseGeocodeRequest;
use App\Services\PsgcLocationDataUnavailable;
use App\Services\PsgcLocationService;
use App\Services\ReverseGeocodeService;
use App\Services\ReverseGeocodeUnavailable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LocationController extends Controller
{
    public function __construct(
        private readonly PsgcLocationService $service,
        private readonly ReverseGeocodeService $reverseGeocodeService,
    ) {}

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

    public function reverseGeocode(ReverseGeocodeRequest $request): JsonResponse
    {
        $validated = $request->validated();

        try {
            $detected = $this->reverseGeocodeService->reverse(
                (float) $validated['latitude'],
                (float) $validated['longitude'],
            );

            $city = $this->service->matchCity($detected['city_municipality']);
            $barangay = $city === null
                ? null
                : $this->service->matchBarangay($detected['barangay'], $city['code']);
        } catch (ReverseGeocodeUnavailable $exception) {
            Log::notice('Reverse geocode endpoint could not verify a map pin.', [
                'reason' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => 'The map pin could not be verified right now. You can continue with manual location fields.',
            ], 502);
        } catch (PsgcLocationDataUnavailable $exception) {
            Log::error('PSGC data was unavailable while matching a reverse geocode result.', [
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'latitude' => (float) $validated['latitude'],
                'longitude' => (float) $validated['longitude'],
                'detected' => $detected,
                'psgc' => [
                    'city_municipality' => null,
                    'city_municipality_code' => null,
                    'barangay' => null,
                    'barangay_code' => null,
                ],
                'match' => [
                    'city' => 'unmatched',
                    'barangay' => 'unresolved',
                ],
            ]);
        }

        return response()->json([
            'latitude' => (float) $validated['latitude'],
            'longitude' => (float) $validated['longitude'],
            'detected' => $detected,
            'psgc' => [
                'city_municipality' => $city['name'] ?? null,
                'city_municipality_code' => $city['code'] ?? null,
                'barangay' => $barangay['name'] ?? null,
                'barangay_code' => $barangay['code'] ?? null,
            ],
            'match' => [
                'city' => $city === null ? 'unmatched' : 'matched',
                'barangay' => $barangay === null ? 'unresolved' : 'matched',
            ],
        ]);
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
