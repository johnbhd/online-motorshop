<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminTaxonomyApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_taxonomy_endpoints_require_admin_role(): void
    {
        $this->getJson('/api/admin/categories')->assertUnauthorized();
        $this->getJson('/api/admin/brands')->assertUnauthorized();

        $staff = $this->createUser('staff');

        $this->adminRequest($staff)->getJson('/api/admin/categories')->assertForbidden();
        $this->adminRequest($staff)->getJson('/api/admin/brands')->assertForbidden();
    }

    public function test_categories_support_crud_counts_context_products_and_safe_delete(): void
    {
        $admin = $this->createUser('admin');

        $created = $this->adminRequest($admin)
            ->postJson('/api/admin/categories', [
                'name' => ' Brake Parts ',
                'description' => 'Stopping system components',
                'status' => 'active',
            ])
            ->assertCreated()
            ->assertJsonPath('category.name', 'Brake Parts')
            ->json('category');

        $this->adminRequest($admin)
            ->postJson('/api/admin/categories', ['name' => 'brake parts'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);

        $category = Category::query()->findOrFail($created['id']);
        $brand = Brand::create(['name' => 'Honda', 'status' => 'active']);
        $product = Product::create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'name' => 'Brake Pad',
            'part_number' => 'TAX-CAT-001',
            'brand' => 'Honda',
            'price' => 100,
            'img_url' => 'https://example.com/brake.png',
            'availability_status' => 'active',
            'status' => 'active',
        ]);

        $this->adminRequest($admin)
            ->getJson('/api/admin/categories')
            ->assertOk()
            ->assertJsonPath('categories.0.product_count', 1);

        $this->adminRequest($admin)
            ->getJson('/api/admin/categories/'.$category->id.'/products')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('products.0.id', $product->id);

        $this->adminRequest($admin)
            ->deleteJson('/api/admin/categories/'.$category->id)
            ->assertStatus(409)
            ->assertJsonPath('message', 'Category cannot be deleted while products are assigned to it.');

        $empty = Category::create(['name' => 'Empty Category', 'status' => 'active']);
        $this->adminRequest($admin)->deleteJson('/api/admin/categories/'.$empty->id)->assertOk();
        $this->assertDatabaseMissing('categories', ['id' => $empty->id]);
    }

    public function test_brands_support_crud_rename_counts_context_products_and_safe_delete(): void
    {
        $admin = $this->createUser('admin');
        $category = Category::create(['name' => 'Engine Parts', 'status' => 'active']);

        $created = $this->adminRequest($admin)
            ->postJson('/api/admin/brands', ['name' => 'Honda', 'status' => 'active'])
            ->assertCreated()
            ->json('brand');
        $brand = Brand::query()->findOrFail($created['id']);

        $this->adminRequest($admin)
            ->postJson('/api/admin/brands', ['name' => 'honda'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);

        $this->adminRequest($admin)
            ->postJson('/api/admin/products', [
                'category_id' => $category->id,
                'brand_id' => $brand->id,
                'name' => 'Honda Filter',
                'part_number' => 'TAX-BRAND-001',
                'price' => 125,
                'img_url' => 'https://example.com/filter.png',
                'availability_status' => 'active',
                'status' => 'active',
            ])
            ->assertCreated()
            ->assertJsonPath('product.brand', 'Honda');

        $this->adminRequest($admin)
            ->getJson('/api/admin/brands')
            ->assertOk()
            ->assertJsonPath('brands.0.product_count', 1);

        $this->adminRequest($admin)
            ->patchJson('/api/admin/brands/'.$brand->id, ['name' => 'Honda Motors'])
            ->assertOk()
            ->assertJsonPath('brand.name', 'Honda Motors');

        $this->assertDatabaseHas('products', [
            'part_number' => 'TAX-BRAND-001',
            'brand' => 'Honda Motors',
            'brand_id' => $brand->id,
        ]);

        $this->adminRequest($admin)
            ->getJson('/api/admin/brands/'.$brand->id.'/products')
            ->assertOk()
            ->assertJsonPath('products.0.brand', 'Honda Motors');

        $this->adminRequest($admin)
            ->deleteJson('/api/admin/brands/'.$brand->id)
            ->assertStatus(409)
            ->assertJsonPath('message', 'Brand cannot be deleted while products are assigned to it.');

        $empty = Brand::create(['name' => 'Empty Brand', 'status' => 'active']);
        $this->adminRequest($admin)->deleteJson('/api/admin/brands/'.$empty->id)->assertOk();
        $this->assertDatabaseMissing('brands', ['id' => $empty->id]);
    }

    private function adminRequest(User $user)
    {
        return $this->withToken($user->createToken('taxonomy-test')->plainTextToken);
    }

    private function createUser(string $role): User
    {
        return User::create([
            'name' => ucfirst($role).' Taxonomy User',
            'email' => $role.'-taxonomy-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => $role,
        ]);
    }
}
