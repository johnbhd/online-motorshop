<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\DeliveryRequest;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class DeliveryRouteService
{
    private const PROVIDER = 'openrouteservice';

    /**
     * Generate and persist a route snapshot once a delivery has been created.
     * A provider failure is intentionally non-fatal: the customer map can use
     * its existing straight-line fallback until a route is available.
     */
    public function generateFor(DeliveryRequest $deliveryRequest): void
    {
        $deliveryRequest->loadMissing('branch');

        if ($this->hasReusableRoute($deliveryRequest)) {
            return;
        }

        if ($deliveryRequest->route_attempted_at !== null) {
            return;
        }

        $branch = $deliveryRequest->branch;

        if (! $branch instanceof Branch || blank(config('services.openrouteservice.key'))) {
            return;
        }

        $route = $this->generate($branch, $deliveryRequest);

        if ($route === null) {
            $deliveryRequest->forceFill([
                'route_attempted_at' => now(),
            ])->save();

            return;
        }

        $deliveryRequest->forceFill([
            ...$route,
            'route_attempted_at' => now(),
        ])->save();
    }

    /**
     * @return array{route_geometry: array{type: 'LineString', coordinates: list<array{0: float, 1: float}>}, route_distance_meters: int|null, route_provider: string, route_generated_at: Carbon|null}|null
     */
    public function generate(Branch $branch, DeliveryRequest $deliveryRequest): ?array
    {
        $origin = $this->coordinatePair($branch->longitude, $branch->latitude);
        $destination = $this->coordinatePair(
            $deliveryRequest->delivery_longitude,
            $deliveryRequest->delivery_latitude,
        );

        if ($origin === null || $destination === null) {
            return null;
        }

        $apiKey = trim((string) config('services.openrouteservice.key'));
        $baseUrl = rtrim((string) config('services.openrouteservice.base_url'), '/');
        $timeout = max(1, (int) config('services.openrouteservice.timeout', 8));

        try {
            $response = Http::timeout($timeout)
                ->withHeaders([
                    'Authorization' => $apiKey,
                    'Accept' => 'application/json, application/geo+json, application/gpx+xml, image/png; charset=utf-8',
                    'Content-Type' => 'application/json',
                ])
                ->post($baseUrl.'/v2/directions/driving-car/geojson', [
                    'coordinates' => [$origin, $destination],
                    'instructions' => false,
                ]);

            if (! $response->successful()) {
                Log::warning('Delivery route provider returned an unsuccessful response.', [
                    'delivery_request_id' => $deliveryRequest->getKey(),
                    'provider' => self::PROVIDER,
                    'status' => $response->status(),
                ]);

                return null;
            }

            $payload = $response->json();
            $geometry = is_array($payload) ? data_get($payload, 'features.0.geometry') : null;

            if (! is_array($geometry) || ($geometry['type'] ?? null) !== 'LineString') {
                Log::warning('Delivery route provider returned invalid geometry.', [
                    'delivery_request_id' => $deliveryRequest->getKey(),
                    'provider' => self::PROVIDER,
                ]);

                return null;
            }

            $coordinates = $this->normalizeGeometry($geometry['coordinates'] ?? null);

            if (count($coordinates) < 2) {
                Log::warning('Delivery route provider returned an incomplete geometry.', [
                    'delivery_request_id' => $deliveryRequest->getKey(),
                    'provider' => self::PROVIDER,
                ]);

                return null;
            }

            $distance = is_array($payload)
                ? data_get($payload, 'features.0.properties.summary.distance')
                : null;

            return [
                'route_geometry' => [
                    'type' => 'LineString',
                    'coordinates' => $coordinates,
                ],
                'route_distance_meters' => is_numeric($distance)
                    ? max(0, (int) round((float) $distance))
                    : null,
                'route_provider' => self::PROVIDER,
                'route_generated_at' => now(),
            ];
        } catch (Throwable $exception) {
            Log::warning('Delivery route generation failed.', [
                'delivery_request_id' => $deliveryRequest->getKey(),
                'provider' => self::PROVIDER,
                'exception' => $exception::class,
            ]);

            return null;
        }
    }

    private function hasReusableRoute(DeliveryRequest $deliveryRequest): bool
    {
        $geometry = $deliveryRequest->route_geometry;

        return is_array($geometry)
            && ($geometry['type'] ?? null) === 'LineString'
            && count($this->normalizeGeometry($geometry['coordinates'] ?? null)) >= 2;
    }

    /**
     * @return array{0: float, 1: float}|null
     */
    private function coordinatePair(mixed $longitude, mixed $latitude): ?array
    {
        if (! is_numeric($longitude) || ! is_numeric($latitude)) {
            return null;
        }

        $longitude = (float) $longitude;
        $latitude = (float) $latitude;

        if (! is_finite($longitude) || ! is_finite($latitude)
            || abs($longitude) > 180 || abs($latitude) > 90) {
            return null;
        }

        return [$longitude, $latitude];
    }

    /**
     * @return list<array{0: float, 1: float}>
     */
    private function normalizeGeometry(mixed $coordinates): array
    {
        if (! is_array($coordinates)) {
            return [];
        }

        $normalized = [];

        foreach ($coordinates as $coordinate) {
            if (! is_array($coordinate) || count($coordinate) < 2) {
                continue;
            }

            $pair = $this->coordinatePair($coordinate[0] ?? null, $coordinate[1] ?? null);

            if ($pair !== null) {
                $normalized[] = $pair;
            }
        }

        return $normalized;
    }
}
