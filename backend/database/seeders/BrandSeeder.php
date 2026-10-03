<?php

namespace Database\Seeders;

use App\Models\Brand;
use Illuminate\Database\Seeder;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['Honda', 'Suzuki', 'Yamaha', 'Universal'] as $name) {
            Brand::updateOrCreate(
                ['name' => $name],
                ['status' => 'active'],
            );
        }
    }
}
