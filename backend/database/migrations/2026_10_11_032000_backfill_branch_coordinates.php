<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $coordinates = [
            'Manila Branch' => [
                'latitude' => 14.5828278,
                'longitude' => 121.0151083,
            ],
            'Makati Branch' => [
                'latitude' => 14.55413,
                'longitude' => 121.00258,
            ],
            'Imus Branch' => [
                'latitude' => 14.4214,
                'longitude' => 120.94197,
            ],
        ];

        foreach ($coordinates as $name => $coordinate) {
            DB::table('branches')
                ->where('name', $name)
                ->whereNull('latitude')
                ->whereNull('longitude')
                ->update($coordinate);
        }
    }

    public function down(): void
    {
        $coordinates = [
            'Manila Branch' => [
                'latitude' => 14.5828278,
                'longitude' => 121.0151083,
            ],
            'Makati Branch' => [
                'latitude' => 14.55413,
                'longitude' => 121.00258,
            ],
            'Imus Branch' => [
                'latitude' => 14.4214,
                'longitude' => 120.94197,
            ],
        ];

        foreach ($coordinates as $name => $coordinate) {
            DB::table('branches')
                ->where('name', $name)
                ->where('latitude', $coordinate['latitude'])
                ->where('longitude', $coordinate['longitude'])
                ->update([
                    'latitude' => null,
                    'longitude' => null,
                ]);
        }
    }
};
