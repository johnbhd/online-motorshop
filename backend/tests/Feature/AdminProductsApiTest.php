<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Customer;
use App\Models\OrderRequest;
use App\Models\Product;
use App\Models\User;
use App\Services\CloudinaryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Tests\Fakes\FakeCloudinaryService;
use Tests\TestCase;

class AdminProductsApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');
        $app->instance(CloudinaryService::class, new FakeCloudinaryService);

        return $app;
    }

    public function test_admin_product_endpoints_require_admin_role(): void
    {
        $this->getJson('/api/admin/products')->assertUnauthorized();

        $customer = $this->createUser('customer');
        $staff = $this->createUser('staff');

        $this->withToken($customer->createToken('admin-products-customer')->plainTextToken)
            ->getJson('/api/admin/products')
            ->assertForbidden();

        $this->withToken($staff->createToken('admin-products-staff')->plainTextToken)
            ->getJson('/api/admin/products')
            ->assertForbidden();
    }

    public function test_admin_can_list_search_filter_and_paginate_real_products(): void
    {
        $admin = $this->createUser('admin');
        $brakes = $this->createCategory('Brake Parts');
        $electrical = $this->createCategory('Electrical Parts');
        $product = $this->createProduct($brakes, [
            'name' => 'Honda Brake Pad',
            'part_number' => 'HON-ADMIN-001',
            'brand' => 'Honda',
        ]);
        $this->createProduct($electrical, [
            'name' => 'Yamaha Spark Plug',
            'part_number' => 'YAM-ADMIN-002',
            'brand' => 'Yamaha',
        ]);
        $this->createProduct($brakes, [
            'name' => 'Archived Rotor',
            'part_number' => 'ARC-ADMIN-003',
            'status' => 'archived',
        ]);

        $response = $this->adminRequest($admin)
            ->getJson('/api/admin/products?search=HON&brand=Honda&category=Brake%20Parts&per_page=1');

        $response
            ->assertOk()
            ->assertJsonPath('summary.total', 3)
            ->assertJsonPath('summary.active', 2)
            ->assertJsonPath('summary.inactive', 1)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('products.0.id', $product->id)
            ->assertJsonPath('products.0.category', 'Brake Parts')
            ->assertJsonPath('products.0.img_url', $product->img_url);

        $this->adminRequest($admin)
            ->getJson('/api/admin/products/data?per_page=2&page=2')
            ->assertOk()
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.last_page', 2);
    }

    public function test_admin_can_create_update_and_delete_products_without_changing_order_snapshots(): void
    {
        $admin = $this->createUser('admin');
        $category = $this->createCategory('Maintenance Parts');
        $otherCategory = $this->createCategory('Electrical Parts');
        $brand = $this->createBrand('Universal');

        $payload = [
            'category_id' => $category->id,
            'name' => '  New Product  ',
            'part_number' => 'NEW-ADMIN-001',
            'brand_id' => $brand->id,
            'description' => 'New product description',
            'price' => 420.5,
            'img_url' => 'https://example.com/new-product.png',
            'availability_status' => 'active',
            'status' => 'active',
            'id' => 999999,
        ];

        $created = $this->adminRequest($admin)
            ->postJson('/api/admin/products', $payload)
            ->assertCreated()
            ->assertJsonPath('product.name', 'New Product')
            ->assertJsonPath('product.price', 420.5)
            ->assertJsonPath('product.category_id', $category->id);

        $product = Product::query()->where('part_number', 'NEW-ADMIN-001')->firstOrFail();
        $this->assertNotSame(999999, $product->id);

        $this->adminRequest($admin)
            ->postJson('/api/admin/products', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['part_number']);

        $this->adminRequest($admin)
            ->patchJson('/api/admin/products/NEW-ADMIN-001', [
                'category_id' => $otherCategory->id,
                'name' => 'Updated Product',
                'part_number' => 'UPDATED-ADMIN-001',
                'price' => 599.99,
                'img_url' => 'https://example.com/updated-product.png',
            ])
            ->assertOk()
            ->assertJsonPath('product.part_number', 'UPDATED-ADMIN-001')
            ->assertJsonPath('product.price', 599.99);

        $customer = Customer::create([
            'full_name' => 'Historical Customer',
            'contact_number' => '09170000000',
            'email' => 'historical-'.uniqid().'@example.com',
        ]);
        $order = OrderRequest::create([
            'order_reference' => 'HIST-'.uniqid(),
            'customer_id' => $customer->id,
            'fulfillment_type' => 'pickup',
            'order_status' => 'pending',
            'subtotal' => 599.99,
            'delivery_fee' => 0,
            'total_amount' => 599.99,
        ]);
        $order->items()->create([
            'product_id' => $product->id,
            'product_name' => 'Updated Product snapshot',
            'unit_price' => 599.99,
            'quantity' => 1,
            'subtotal' => 599.99,
        ]);

        $this->adminRequest($admin)
            ->patchJson('/api/admin/products/UPDATED-ADMIN-001', [
                'name' => 'Changed Again',
                'price' => 700,
            ])
            ->assertOk();

        $this->assertDatabaseHas('order_items', [
            'product_id' => $product->id,
            'product_name' => 'Updated Product snapshot',
            'unit_price' => 599.99,
        ]);

        $this->adminRequest($admin)
            ->deleteJson('/api/admin/products/UPDATED-ADMIN-001')
            ->assertStatus(409)
            ->assertJsonPath('message', 'Product cannot be deleted because it is referenced by an existing order.');

        $unreferenced = $this->createProduct($category, [
            'part_number' => 'DELETE-ADMIN-001',
        ]);

        $this->adminRequest($admin)
            ->deleteJson('/api/admin/products/'.$unreferenced->part_number)
            ->assertOk();

        $this->assertDatabaseMissing('products', ['id' => $unreferenced->id]);
        $this->assertNotNull($created->json('product.id'));
    }

    public function test_product_validation_and_public_catalog_reflect_admin_changes(): void
    {
        $admin = $this->createUser('admin');
        $category = $this->createCategory('Validation Parts');
        $product = $this->createProduct($category, [
            'part_number' => 'PUBLIC-ADMIN-001',
        ]);

        $this->adminRequest($admin)
            ->postJson('/api/admin/products', [
                'category_id' => 999999,
                'name' => '',
                'part_number' => 'INVALID-ADMIN-001',
                'brand_id' => $this->createBrand('Validation Brand')->id,
                'price' => -1,
                'img_url' => '',
                'availability_status' => 'active',
                'status' => 'active',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['category_id', 'name', 'price', 'img_url']);

        $this->getJson('/api/products/'.$product->part_number)
            ->assertOk()
            ->assertJsonPath('product.part_number', $product->part_number);

        $this->adminRequest($admin)
            ->patchJson('/api/admin/products/'.$product->part_number, [
                'status' => 'inactive',
            ])
            ->assertOk();

        $this->getJson('/api/products/'.$product->part_number)
            ->assertNotFound();
    }

    public function test_admin_product_image_upload_and_replacement_use_cloudinary_metadata(): void
    {
        $admin = $this->createUser('admin');
        $category = $this->createCategory('Cloudinary Parts');
        $brand = $this->createBrand('Cloudinary Brand');

        $created = $this->adminRequest($admin)
            ->post('/api/admin/products', [
                'category_id' => $category->id,
                'name' => 'Cloudinary Product',
                'part_number' => 'CLOUDINARY-001',
                'brand_id' => $brand->id,
                'price' => 250,
                'image' => $this->validImage('product.png'),
                'availability_status' => 'active',
                'status' => 'active',
            ])
            ->assertCreated()
            ->assertJsonPath('product.img_public_id', 'ald-motorshop/products/fake-1');

        $product = Product::query()->where('part_number', 'CLOUDINARY-001')->firstOrFail();
        $oldPublicId = $product->img_public_id;

        $this->assertSame(
            'https://res.cloudinary.com/test/image/upload/ald-motorshop/products/fake-1.png',
            $created->json('product.img_url'),
        );

        $this->adminRequest($admin)
            ->post('/api/admin/products/CLOUDINARY-001', [
                '_method' => 'PATCH',
                'name' => 'Replaced Cloudinary Product',
                'image' => $this->validImage('replacement.webp'),
            ])
            ->assertOk()
            ->assertJsonPath('product.img_public_id', 'ald-motorshop/products/fake-2');

        $product->refresh();
        $this->assertSame('ald-motorshop/products/fake-2', $product->img_public_id);
        $this->assertContains($oldPublicId, app(CloudinaryService::class)->deletions);
    }

    public function test_inactive_taxonomy_is_preserved_for_existing_products_but_not_new_assignments(): void
    {
        $admin = $this->createUser('admin');
        $inactiveCategory = $this->createCategory('Inactive Category');
        $inactiveCategory->update(['status' => 'inactive']);
        $anotherInactiveCategory = $this->createCategory('Another Inactive Category');
        $anotherInactiveCategory->update(['status' => 'inactive']);
        $activeCategory = $this->createCategory('Active Category');
        $inactiveBrand = $this->createBrand('Inactive Brand');
        $inactiveBrand->update(['status' => 'inactive']);
        $anotherInactiveBrand = $this->createBrand('Another Inactive Brand');
        $anotherInactiveBrand->update(['status' => 'inactive']);
        $activeBrand = $this->createBrand('Active Brand');

        $payload = [
            'category_id' => $inactiveCategory->id,
            'name' => 'New Inactive Assignment',
            'part_number' => 'INACTIVE-TAXONOMY-001',
            'brand_id' => $activeBrand->id,
            'price' => 100,
            'img_url' => 'https://example.com/inactive.png',
            'availability_status' => 'active',
            'status' => 'active',
        ];

        $this->adminRequest($admin)
            ->postJson('/api/admin/products', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['category_id']);

        $payload['category_id'] = $activeCategory->id;
        $payload['brand_id'] = $inactiveBrand->id;

        $this->adminRequest($admin)
            ->postJson('/api/admin/products', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['brand_id']);

        $product = $this->createProduct($inactiveCategory, [
            'part_number' => 'EXISTING-INACTIVE-TAXONOMY-001',
            'brand_id' => $inactiveBrand->id,
            'brand' => $inactiveBrand->name,
        ]);

        $this->adminRequest($admin)
            ->patchJson('/api/admin/products/'.$product->part_number, ['name' => 'Still Assigned'])
            ->assertOk()
            ->assertJsonPath('product.category', $inactiveCategory->name)
            ->assertJsonPath('product.brand', $inactiveBrand->name);

        $this->adminRequest($admin)
            ->patchJson('/api/admin/products/'.$product->part_number, [
                'category_id' => $anotherInactiveCategory->id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['category_id']);

        $this->adminRequest($admin)
            ->patchJson('/api/admin/products/'.$product->part_number, [
                'brand_id' => $anotherInactiveBrand->id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['brand_id']);

        $this->adminRequest($admin)
            ->getJson('/api/admin/products')
            ->assertOk()
            ->assertJsonPath('filters.categories.0.status', 'active')
            ->assertJsonPath('filters.brand_options.0.status', 'active');
    }

    private function adminRequest(User $admin)
    {
        return $this->withToken($admin->createToken('admin-products-test')->plainTextToken);
    }

    private function createUser(string $role): User
    {
        return User::create([
            'name' => ucfirst($role).' Product User',
            'email' => $role.'-products-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => $role,
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

    private function createBrand(string $name): Brand
    {
        return Brand::create([
            'name' => $name,
            'description' => $name.' description',
            'status' => 'active',
        ]);
    }

    private function validImage(string $filename): UploadedFile
    {
        $contents = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
            true,
        );

        return UploadedFile::fake()->createWithContent($filename, $contents ?: '');
    }

    /** @param array<string, mixed> $overrides */
    private function createProduct(Category $category, array $overrides = []): Product
    {
        return Product::create(array_merge([
            'category_id' => $category->id,
            'name' => 'Admin Test Product',
            'part_number' => 'ADMIN-'.uniqid(),
            'brand' => 'Universal',
            'description' => 'Admin test product',
            'price' => 180,
            'img_url' => 'https://example.com/admin-product.png',
            'availability_status' => 'active',
            'status' => 'active',
        ], $overrides));
    }
}
