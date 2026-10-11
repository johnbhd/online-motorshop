<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
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
