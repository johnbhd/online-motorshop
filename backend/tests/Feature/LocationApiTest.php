<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class LocationApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');
        $app['config']->set('cache.default', 'array');

        return $app;
    }

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('psgc');
        Storage::disk('psgc')->put('cities-municipalities.json', json_encode([
            [
                'code' => '1300000000',
                'name' => 'Manila',
                'region_code' => '1300000000',
                'province_code' => null,
                'municipality_code' => '1300000000',
                'geographic_level' => 'city',
            ],
            [
                'code' => '0102801000',
                'name' => 'Adams',
                'region_code' => '0100000000',
                'province_code' => '0102800000',
                'municipality_code' => '0102801000',
                'geographic_level' => 'municipality',
            ],
            [
                'code' => '1705301000',
                'name' => 'Aborlan',
                'region_code' => '1700000000',
                'province_code' => '1705300000',
                'municipality_code' => '1705301000',
                'geographic_level' => 'municipality',
            ],
        ], JSON_THROW_ON_ERROR));
        Storage::disk('psgc')->put('barangays.json', json_encode([
            [
                'code' => '1300000001',
                'name' => 'Barangay One',
                'region_code' => '1300000000',
                'province_code' => null,
                'city_municipality_code' => '1300000000',
            ],
            [
                'code' => '0102801001',
                'name' => 'Barangay Adams',
                'region_code' => '0100000000',
                'province_code' => '0102800000',
                'city_municipality_code' => '0102801000',
            ],
        ], JSON_THROW_ON_ERROR));
    }

    public function test_public_location_endpoints_return_string_codes_and_city_scoped_barangays(): void
    {
        $cities = $this->getJson('/api/locations/cities-municipalities')
            ->assertOk()
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('cities_municipalities.0.code', '1705301000')
            ->assertJsonPath('cities_municipalities.0.geographic_level', 'municipality')
            ->assertJsonPath('cities_municipalities.2.province_code', null);

        $this->assertIsString($cities->json('cities_municipalities.0.code'));

        $this->getJson('/api/locations/cities-municipalities/1300000000/barangays')
            ->assertOk()
            ->assertJsonPath('city_municipality.code', '1300000000')
            ->assertJsonCount(1, 'barangays')
            ->assertJsonPath('barangays.0.code', '1300000001')
            ->assertJsonMissing(['code' => '0102801001']);
    }

    public function test_location_endpoint_validates_unknown_codes(): void
    {
        $this->getJson('/api/locations/cities-municipalities/not-a-code/barangays')
            ->assertStatus(422);

        $this->getJson('/api/locations/cities-municipalities/9999999999/barangays')
            ->assertNotFound();
    }

    public function test_reverse_geocode_returns_detected_location_and_psgc_matches(): void
    {
        Http::fake([
            'https://nominatim.openstreetmap.org/reverse*' => Http::response([
                'address' => [
                    'city' => 'Manila',
                    'barangay' => 'Barangay One',
                ],
            ], 200),
        ]);

        $this->postJson('/api/locations/reverse-geocode', [
            'latitude' => 14.5995,
            'longitude' => 120.9842,
        ])
            ->assertOk()
            ->assertJsonPath('detected.city_municipality', 'Manila')
            ->assertJsonPath('detected.barangay', 'Barangay One')
            ->assertJsonPath('detected.area', null)
            ->assertJsonPath('psgc.city_municipality', 'Manila')
            ->assertJsonPath('psgc.city_municipality_code', '1300000000')
            ->assertJsonPath('psgc.barangay', 'Barangay One')
            ->assertJsonPath('psgc.barangay_code', '1300000001')
            ->assertJsonPath('match.city', 'matched')
            ->assertJsonPath('match.barangay', 'matched');

        Http::assertSent(fn ($request): bool => str_starts_with($request->url(), 'https://nominatim.openstreetmap.org/reverse')
            && (float) $request['lat'] === 14.5995
            && (float) $request['lon'] === 120.9842);
    }

    public function test_reverse_geocode_returns_a_partial_match_without_inventing_codes(): void
    {
        Http::fake([
            'https://nominatim.openstreetmap.org/reverse*' => Http::response([
                'address' => [
                    'city' => 'Manila',
                    'suburb' => 'Unknown Neighborhood',
                ],
            ], 200),
        ]);

        $this->postJson('/api/locations/reverse-geocode', [
            'latitude' => 14.5995,
            'longitude' => 120.9842,
        ])
            ->assertOk()
            ->assertJsonPath('detected.barangay', null)
            ->assertJsonPath('detected.area', 'Unknown Neighborhood')
            ->assertJsonPath('psgc.city_municipality_code', '1300000000')
            ->assertJsonPath('psgc.barangay', null)
            ->assertJsonPath('psgc.barangay_code', null)
            ->assertJsonPath('match.city', 'matched')
            ->assertJsonPath('match.barangay', 'unresolved');
    }

    public function test_reverse_geocode_keeps_a_district_out_of_the_canonical_barangay_field(): void
    {
        Http::fake([
            'https://nominatim.openstreetmap.org/reverse*' => Http::response([
                'address' => [
                    'city' => 'Manila',
                    'suburb' => 'Santa Mesa',
                ],
            ], 200),
        ]);

        $this->postJson('/api/locations/reverse-geocode', [
            'latitude' => 14.5995,
            'longitude' => 120.9842,
        ])
            ->assertOk()
            ->assertJsonPath('detected.city_municipality', 'Manila')
            ->assertJsonPath('detected.barangay', null)
            ->assertJsonPath('detected.area', 'Santa Mesa')
            ->assertJsonPath('psgc.city_municipality', 'Manila')
            ->assertJsonPath('psgc.barangay', null)
            ->assertJsonPath('psgc.barangay_code', null)
            ->assertJsonPath('match.city', 'matched')
            ->assertJsonPath('match.barangay', 'unresolved');
    }

    public function test_reverse_geocode_provider_failure_is_safe_and_coordinates_are_validated(): void
    {
        Http::fake([
            'https://nominatim.openstreetmap.org/reverse*' => Http::response([], 503),
        ]);

        $this->postJson('/api/locations/reverse-geocode', [
            'latitude' => 14.5995,
            'longitude' => 120.9842,
        ])
            ->assertStatus(502)
            ->assertJsonPath('message', 'The map pin could not be verified right now. You can continue with manual location fields.');

        $this->postJson('/api/locations/reverse-geocode', [
            'latitude' => 91,
            'longitude' => 181,
        ])->assertUnprocessable()->assertJsonValidationErrors(['latitude', 'longitude']);
    }

    public function test_customer_profile_saves_canonical_location_names_and_rejects_cross_city_barangays(): void
    {
        $customer = User::create([
            'name' => 'Location Customer',
            'email' => 'location-customer@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'customer',
        ]);
        $customer->customer()->create([
            'full_name' => 'Location Customer',
            'contact_number' => '09170000000',
            'email' => 'location-customer@example.com',
        ]);
        $token = $customer->createToken('location-profile-test')->plainTextToken;

        $this->withToken($token)
            ->patchJson('/api/customer/profile', [
                'name' => 'Location Customer',
                'email' => 'location-customer@example.com',
                'contact_number' => '09170000000',
                'city_municipality_code' => '1300000000',
                'barangay_code' => '1300000001',
            ])
            ->assertOk()
            ->assertJsonPath('user.customer.city_municipality_code', '1300000000')
            ->assertJsonPath('user.customer.barangay_code', '1300000001')
            ->assertJsonPath('user.customer.city', 'Manila')
            ->assertJsonPath('user.customer.barangay', 'Barangay One');

        $this->assertDatabaseHas('customers', [
            'user_id' => $customer->id,
            'city_municipality_code' => '1300000000',
            'barangay_code' => '1300000001',
            'city' => 'Manila',
            'barangay' => 'Barangay One',
        ]);

        $this->withToken($token)
            ->patchJson('/api/customer/profile', [
                'name' => 'Location Customer',
                'email' => 'location-customer@example.com',
                'contact_number' => '09170000000',
                'city_municipality_code' => '1300000000',
                'barangay_code' => '0102801001',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['barangay_code']);
    }

    public function test_customer_profile_accepts_custom_values_and_verified_city_with_custom_barangay(): void
    {
        $customer = User::create([
            'name' => 'Flexible Location Customer',
            'email' => 'flexible-location@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'customer',
        ]);
        $customer->customer()->create([
            'full_name' => 'Flexible Location Customer',
            'contact_number' => '09170000000',
            'email' => 'flexible-location@example.com',
        ]);
        $token = $customer->createToken('flexible-location-test')->plainTextToken;

        $this->withToken($token)
            ->patchJson('/api/customer/profile', [
                'name' => 'Flexible Location Customer',
                'email' => 'flexible-location@example.com',
                'contact_number' => '09170000000',
                'city_municipality' => 'Near Makati CBD',
                'barangay' => 'San Antonio Village',
                'city_municipality_code' => null,
                'barangay_code' => null,
            ])
            ->assertOk()
            ->assertJsonPath('user.customer.city_municipality_code', null)
            ->assertJsonPath('user.customer.barangay_code', null)
            ->assertJsonPath('user.customer.city', 'Near Makati CBD')
            ->assertJsonPath('user.customer.barangay', 'San Antonio Village');

        $this->withToken($token)
            ->patchJson('/api/customer/profile', [
                'name' => 'Flexible Location Customer',
                'email' => 'flexible-location@example.com',
                'contact_number' => '09170000000',
                'city_municipality' => 'Client-supplied city label',
                'barangay' => 'Local Barangay Name',
                'city_municipality_code' => '1300000000',
                'barangay_code' => null,
            ])
            ->assertOk()
            ->assertJsonPath('user.customer.city_municipality_code', '1300000000')
            ->assertJsonPath('user.customer.barangay_code', null)
            ->assertJsonPath('user.customer.city', 'Manila')
            ->assertJsonPath('user.customer.barangay', 'Local Barangay Name');

        $this->withToken($token)
            ->patchJson('/api/customer/profile', [
                'name' => 'Flexible Location Customer',
                'email' => 'flexible-location@example.com',
                'contact_number' => '09170000000',
                'city_municipality' => 'Custom City',
                'barangay' => 'Barangay One',
                'city_municipality_code' => null,
                'barangay_code' => '1300000001',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['city_municipality_code']);
    }

    public function test_customer_profile_keeps_a_manual_barangay_when_the_pin_only_resolves_an_area(): void
    {
        Http::fake([
            'https://nominatim.openstreetmap.org/reverse*' => Http::response([
                'address' => [
                    'city' => 'Manila',
                    'suburb' => 'Santa Mesa',
                ],
            ], 200),
        ]);

        $customer = User::create([
            'name' => 'Manual Barangay Customer',
            'email' => 'manual-barangay@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'customer',
        ]);
        $customer->customer()->create([
            'full_name' => 'Manual Barangay Customer',
            'contact_number' => '09170000000',
            'email' => 'manual-barangay@example.com',
        ]);
        $token = $customer->createToken('manual-barangay-test')->plainTextToken;

        $this->withToken($token)
            ->patchJson('/api/customer/profile', [
                'name' => 'Manual Barangay Customer',
                'email' => 'manual-barangay@example.com',
                'contact_number' => '09170000000',
                'city_municipality_code' => '1300000000',
                'barangay' => 'Manual Barangay Name',
                'barangay_code' => null,
                'latitude' => 14.5995,
                'longitude' => 120.9842,
            ])
            ->assertOk()
            ->assertJsonPath('user.customer.city', 'Manila')
            ->assertJsonPath('user.customer.barangay', 'Manual Barangay Name')
            ->assertJsonPath('user.customer.barangay_code', null);
    }

    public function test_customer_profile_accepts_a_canonical_manual_barangay_when_the_pin_has_no_barangay_match(): void
    {
        Http::fake([
            'https://nominatim.openstreetmap.org/reverse*' => Http::response([
                'address' => [
                    'city' => 'Manila',
                    'suburb' => 'Santa Mesa',
                ],
            ], 200),
        ]);

        $customer = User::create([
            'name' => 'Canonical Manual Customer',
            'email' => 'canonical-manual@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'customer',
        ]);
        $customer->customer()->create([
            'full_name' => 'Canonical Manual Customer',
            'contact_number' => '09170000000',
            'email' => 'canonical-manual@example.com',
        ]);
        $token = $customer->createToken('canonical-manual-test')->plainTextToken;

        $this->withToken($token)
            ->patchJson('/api/customer/profile', [
                'name' => 'Canonical Manual Customer',
                'email' => 'canonical-manual@example.com',
                'contact_number' => '09170000000',
                'city_municipality' => 'Manila',
                'city_municipality_code' => '1300000000',
                'barangay' => 'Barangay One',
                'barangay_code' => '1300000001',
                'latitude' => 14.5995,
                'longitude' => 120.9842,
            ])
            ->assertOk()
            ->assertJsonPath('user.customer.city', 'Manila')
            ->assertJsonPath('user.customer.city_municipality_code', '1300000000')
            ->assertJsonPath('user.customer.barangay', 'Barangay One')
            ->assertJsonPath('user.customer.barangay_code', '1300000001');
    }

    public function test_customer_profile_rejects_a_confident_pin_city_mismatch(): void
    {
        Http::fake([
            'https://nominatim.openstreetmap.org/reverse*' => Http::response([
                'address' => [
                    'city' => 'Manila',
                    'suburb' => 'Barangay One',
                ],
            ], 200),
        ]);

        $customer = User::create([
            'name' => 'Pinned Customer',
            'email' => 'pinned-customer@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'customer',
        ]);
        $customer->customer()->create([
            'full_name' => 'Pinned Customer',
            'contact_number' => '09170000000',
            'email' => 'pinned-customer@example.com',
        ]);
        $token = $customer->createToken('pinned-profile-test')->plainTextToken;

        $this->withToken($token)
            ->patchJson('/api/customer/profile', [
                'name' => 'Pinned Customer',
                'email' => 'pinned-customer@example.com',
                'contact_number' => '09170000000',
                'city_municipality_code' => '0102801000',
                'barangay_code' => '0102801001',
                'latitude' => 14.5995,
                'longitude' => 120.9842,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['city', 'city_municipality_code']);

        $this->assertDatabaseMissing('customers', [
            'user_id' => $customer->id,
            'latitude' => 14.5995,
        ]);
    }

    public function test_legacy_customer_location_names_are_returned_when_codes_are_missing(): void
    {
        $customer = User::create([
            'name' => 'Legacy Customer',
            'email' => 'legacy-location@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'customer',
        ]);
        $customer->customer()->create([
            'full_name' => 'Legacy Customer',
            'contact_number' => '09170000000',
            'email' => 'legacy-location@example.com',
            'city' => 'Legacy City',
            'barangay' => 'Legacy Barangay',
        ]);
        $token = $customer->createToken('legacy-location-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/customer/profile')
            ->assertOk()
            ->assertJsonPath('user.customer.city', 'Legacy City')
            ->assertJsonPath('user.customer.barangay', 'Legacy Barangay')
            ->assertJsonPath('user.customer.city_municipality_code', null)
            ->assertJsonPath('user.customer.barangay_code', null);
    }
}
