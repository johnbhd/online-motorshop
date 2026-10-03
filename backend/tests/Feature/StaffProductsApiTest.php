<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StaffProductsApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_staff_products_requires_authentication_and_staff_role(): void
    {
        $this->getJson('/api/staff/products')
            ->assertUnauthorized();

        $customer = User::create([
            'name' => 'Product Customer',
            'email' => 'staff-products-customer@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'customer',
        ]);
        $token = $customer->createToken('staff-products-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/staff/products')
            ->assertForbidden();
    }

    public function test_staff_product_list_uses_real_catalog_with_filters_and_pagination(): void
    {
        $staff = $this->createStaff();
        $brakes = $this->createCategory('Brake Parts');
        $electrical = $this->createCategory('Electrical Parts');
        $honda = $this->createProduct($brakes, [
            'name' => 'Honda Brake Pad',
            'part_number' => 'HON-STAFF-001',
            'brand' => 'Honda',
        ]);
        $yamaha = $this->createProduct($electrical, [
            'name' => 'Yamaha Spark Plug',
            'part_number' => 'YAM-STAFF-002',
            'brand' => 'Yamaha',
        ]);
        $this->createProduct($brakes, [
            'name' => 'Archived Suzuki Rotor',
            'part_number' => 'SUZ-STAFF-003',
            'brand' => 'Suzuki',
            'status' => 'archived',
        ]);

        $token = $staff->createToken('staff-products-test')->plainTextToken;

        $response = $this->withToken($token)
            ->getJson('/api/staff/products?brand=Honda&category=Brake%20Parts&per_page=1')
            ->assertOk()
            ->assertJsonPath('summary.total', 3)
            ->assertJsonPath('summary.active', 2)
            ->assertJsonPath('summary.inactive', 1)
            ->assertJsonPath('summary.inventory_tracked', false)
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.last_page', 1)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('products.0.part_number', $honda->part_number)
            ->assertJsonPath('products.0.category', 'Brake Parts')
            ->assertJsonPath('products.0.inventory', null)
            ->assertJsonMissingPath('products.0.stock_quantity');

        $this->assertContains('Honda', $response->json('filters.brands'));
        $this->assertContains('Brake Parts', collect($response->json('filters.categories'))->pluck('name')->all());
        $this->assertContains('archived', $response->json('filters.statuses'));
        $this->assertSame('Yamaha', $yamaha->brand);

        $this->withToken($token)
            ->getJson('/api/staff/products?search=SUZ-STAFF-003')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('products.0.status', 'archived');

        $this->withToken($token)
            ->getJson('/api/staff/products?per_page=2&page=2')
            ->assertOk()
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonPath('meta.current_page', 2);
    }

    public function test_staff_product_details_return_real_catalog_fields_without_inventory_fiction(): void
    {
        $staff = $this->createStaff();
        $category = $this->createCategory('Details Parts');
        $product = $this->createProduct($category, [
            'name' => 'Honda Detail Product',
            'part_number' => 'HON-STAFF-DETAIL',
            'brand' => 'Honda',
            'description' => 'A persisted product description.',
            'price' => 480,
            'img_url' => 'https://example.com/honda-detail.png',
        ]);
        $token = $staff->createToken('staff-products-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/staff/products/'.$product->part_number)
            ->assertOk()
            ->assertJsonPath('product.id', $product->id)
            ->assertJsonPath('product.part_number', $product->part_number)
            ->assertJsonPath('product.name', $product->name)
            ->assertJsonPath('product.brand', 'Honda')
            ->assertJsonPath('product.category', 'Details Parts')
            ->assertJsonPath('product.price', 480)
            ->assertJsonPath('product.img_url', 'https://example.com/honda-detail.png')
            ->assertJsonPath('product.inventory', null)
            ->assertJsonMissingPath('product.stock_quantity');

        $this->withToken($token)
            ->getJson('/api/staff/products/UNKNOWN-PRODUCT')
            ->assertNotFound();
    }

    private function createStaff(): User
    {
        return User::create([
            'name' => 'Staff Product User',
            'email' => 'staff-product-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'staff',
        ]);
    }

    private function createCategory(string $name): Category
    {
        return Category::create([
            'name' => $name,
            'description' => $name.' description',
            'status' => 'active',
        ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createProduct(Category $category, array $overrides = []): Product
    {
        return Product::create(array_merge([
            'category_id' => $category->id,
            'name' => 'Staff Test Product',
            'part_number' => 'STAFF-'.uniqid(),
            'brand' => 'Universal',
            'description' => 'Staff test product',
            'price' => 180,
            'img_url' => 'https://example.com/staff-product.png',
            'availability_status' => 'active',
            'status' => 'active',
        ], $overrides));
    }
}
