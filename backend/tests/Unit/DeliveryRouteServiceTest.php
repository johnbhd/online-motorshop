<?php

namespace Tests\Unit;

use App\Models\Branch;
use App\Models\DeliveryRequest;
use App\Services\DeliveryRouteService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class DeliveryRouteServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set([
            'services.openrouteservice.key' => 'test-route-key',
            'services.openrouteservice.base_url' => 'https://router.test',
            'services.openrouteservice.timeout' => 3,
        ]);
    }

    public function test_it_normalizes_a_valid_openrouteservice_route_snapshot(): void
    {
        Http::fake([
            'https://router.test/*' => Http::response([
                'features' => [[
                    'geometry' => [
                        'type' => 'LineString',
                        'coordinates' => [
                            [121.0000, 14.0000],
                            [121.0100, 14.0050],
                            [121.0200, 14.0100],
                        ],
                    ],
                    'properties' => [
                        'summary' => ['distance' => 2345.6],
                    ],
                ]],
            ], 200),
        ]);

        $route = app(DeliveryRouteService::class)->generate(
            new Branch([
                'latitude' => 14.0000,
                'longitude' => 121.0000,
            ]),
            new DeliveryRequest([
                'delivery_latitude' => 14.0100,
                'delivery_longitude' => 121.0200,
            ]),
        );

        $this->assertNotNull($route);
        $this->assertSame('LineString', $route['route_geometry']['type']);
        $this->assertSame([
            [121.0, 14.0],
            [121.01, 14.005],
            [121.02, 14.01],
        ], $route['route_geometry']['coordinates']);
        $this->assertSame(2346, $route['route_distance_meters']);
        $this->assertSame('openrouteservice', $route['route_provider']);

        Http::assertSent(fn ($request): bool => $request->hasHeaders([
            'Authorization' => 'test-route-key',
            'Accept' => 'application/json, application/geo+json, application/gpx+xml, image/png; charset=utf-8',
            'Content-Type' => 'application/json',
        ])
            && $request->data()['coordinates'] === [[121.0, 14.0], [121.02, 14.01]]);
    }

    public function test_provider_failure_returns_a_safe_fallback_signal(): void
    {
        Http::fake([
            'https://router.test/*' => Http::response(['error' => 'unavailable'], 503),
        ]);

        $route = app(DeliveryRouteService::class)->generate(
            new Branch(['latitude' => 14.0, 'longitude' => 121.0]),
            new DeliveryRequest(['delivery_latitude' => 14.01, 'delivery_longitude' => 121.02]),
        );

        $this->assertNull($route);
    }

    public function test_invalid_geometry_is_rejected(): void
    {
        Http::fake([
            'https://router.test/*' => Http::response([
                'features' => [[
                    'geometry' => [
                        'type' => 'Polygon',
                        'coordinates' => [],
                    ],
                ]],
            ], 200),
        ]);

        $route = app(DeliveryRouteService::class)->generate(
            new Branch(['latitude' => 14.0, 'longitude' => 121.0]),
            new DeliveryRequest(['delivery_latitude' => 14.01, 'delivery_longitude' => 121.02]),
        );

        $this->assertNull($route);
    }

    public function test_a_valid_existing_snapshot_is_reused_without_a_provider_call(): void
    {
        Http::fake();

        $deliveryRequest = new DeliveryRequest([
            'route_geometry' => [
                'type' => 'LineString',
                'coordinates' => [[121.0, 14.0], [121.02, 14.01]],
            ],
        ]);

        app(DeliveryRouteService::class)->generateFor($deliveryRequest);

        Http::assertNothingSent();
        $this->assertFalse($deliveryRequest->exists);
    }
}
