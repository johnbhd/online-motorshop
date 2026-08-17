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
                'name' => 'Main Branch',
                'contact_number' => '09123456789',
                'pickup_available' => '1',
                'status' => 'active',
            ],
            [
                'name' => 'Quezon City Branch',
                'contact_number' => '09987654321',
                'pickup_available' => '1',
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
