<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $engine = Category::where('name', 'Engine Parts')->firstOrFail();
        $brakes = Category::where('name', 'Brake System')->firstOrFail();
    
        $products = [
            [
                'category_id' => $engine->id,
                'name' => 'Motorcycle Spark Plug',
                'part_number' => 'ENG-001',
                'brand' => 'NGK',
                'description' => 'Standard replacement spark plug',
                'price' => 250.00,
                'img_url' => 'products/spark-plug.jpg',
                'availability_status' => 'active',
                'status' => 'active',
            ],
            [
                'category_id' => $engine->id,
                'name' => 'Engine Oil 1L',
                'part_number' => 'ENG-002',
                'brand' => 'Castrol',
                'description' => 'Four-stroke motorcycle engine oil',
                'price' => 420.00,
                'img_url' => 'products/engine-oil.jpg',
                'availability_status' => 'active',
                'status' => 'active',
            ],
            [
                'category_id' => $brakes->id,
                'name' => 'Front Brake Pads',
                'part_number' => 'BRK-001',
                'brand' => 'Brembo',
                'description' => 'Durable front brake pad set',
                'price' => 650.00,
                'img_url' => 'products/brake-pads.jpg',
                'availability_status' => 'active',
                'status' => 'active',
            ],
        ];


        foreach($products as $product) {
            Product::updateOrCreate(
                ['part_number' => $product['part_number']],
                $product
            );
        }
    }
}
