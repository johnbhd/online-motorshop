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
                'description' => 'Motorcycle engine parts and related components.',
                'status' => 'active',
            ],
            [
                'name' => 'Brake Parts',
                'description' => 'Motorcycle brake parts and braking system components.',
                'status' => 'active',
            ],
            [
                'name' => 'Electrical Parts',
                'description' => 'Motorcycle electrical parts and electrical system components.',
                'status' => 'active',
            ],
            [
                'name' => 'Suspension Parts',
                'description' => 'Motorcycle suspension parts and related components.',
                'status' => 'active',
            ],
            [
                'name' => 'Transmission Parts',
                'description' => 'Motorcycle transmission and drivetrain components.',
                'status' => 'active',
            ],
            [
                'name' => 'Body & Exterior',
                'description' => 'Motorcycle body, exterior, and replacement body components.',
                'status' => 'active',
            ],
            [
                'name' => 'Tires & Wheels',
                'description' => 'Motorcycle tires, wheels, and related components.',
                'status' => 'active',
            ],
            [
                'name' => 'Accessories & Maintenance',
                'description' => 'Motorcycle accessories, maintenance items, and general care products.',
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
