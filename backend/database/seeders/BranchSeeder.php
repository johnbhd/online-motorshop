<?php

namespace Database\Seeders;

use App\Models\Branch;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $branches = [
            [
                'name' => 'Manila Branch',
                'address' => '3333 New Panaderos, Sta. Ana, Manila, 1016 Metro Manila',
                'contact_number' => '+63 995 869 1174',
                'pickup_available' => true,
                'status' => 'active',
            ],
            [
                'name' => 'Makati Branch',
                'address' => '3678 Bautista Street, Makati City',
                'contact_number' => '+63 995 869 1174',
                'pickup_available' => true,
                'status' => 'active',
            ],
            [
                'name' => 'Imus Branch',
                'address' => 'LYS Building, General Aguinaldo Highway, Imus, 4103 Cavite',
                'contact_number' => '+63 995 869 1174',
                'pickup_available' => true,
                'status' => 'active',
            ],
        ];

        foreach($branches as $branch) {
            Branch::updateOrCreate(
                ['name' => $branch['name']],
                $branch
            );
        }
    }
}
