<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Engine Parts',
                'description' => 'Motorcycle engine parts and accessories',
                'status' => 'active'
            ], 
            [
                'name' => 'Brake System',
                'description' => 'Motorcycle brake parts and accessories',
                'status' => 'active',
            ],
            [
                'name' => 'Electrical Parts',
                'description' => 'Motorcycle electrical components',
                'status' => 'active',
            ],
        ];

        foreach ($categories as $category) {
            Category::updateOrCreate(
                ['name' => $category['name']],
                $category
            );
        }
    }
}
