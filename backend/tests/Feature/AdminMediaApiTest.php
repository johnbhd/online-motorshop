<?php

namespace Tests\Feature;

use App\Models\AdminArchive;
use App\Models\Brand;
use App\Models\Category;
use App\Models\MediaAsset;
use App\Models\Product;
use App\Models\User;
use App\Services\AdminProductService;
use App\Services\CloudinaryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Tests\Fakes\FakeCloudinaryService;
use Tests\TestCase;

class AdminMediaApiTest extends TestCase
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

    public function test_admin_can_list_and_view_media_assets(): void
    {
        $admin = $this->createUser('admin');
        $asset = MediaAsset::create([
            'cloudinary_public_id' => 'ald-motorshop/products/list-1',
            'secure_url' => 'https://res.cloudinary.com/test/image/upload/list-1.jpg',
            'purpose' => MediaAsset::PURPOSE_PRODUCT_IMAGE,
            'linked_type' => 'product',
            'linked_id' => 999,
            'status' => MediaAsset::STATUS_ORPHANED,
            'uploaded_at' => now(),
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/media?status=orphaned')
            ->assertOk()
            ->assertJsonPath('summary.orphaned', 1)
            ->assertJsonPath('media.0.id', $asset->id)
            ->assertJsonPath('media.0.can_delete', true);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/media/'.$asset->id)
            ->assertOk()
            ->assertJsonPath('media.cloudinary_public_id', 'ald-motorshop/products/list-1');
    }

    public function test_staff_and_customer_cannot_access_media(): void
    {
        $staff = $this->createUser('staff');
        $customer = $this->createUser('customer');

        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/admin/media')
            ->assertForbidden();

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/admin/media')
            ->assertForbidden();
    }

    public function test_product_upload_registers_media_asset(): void
    {
        $admin = $this->createUser('admin');
        $category = Category::create([
            'name' => 'Media Test Category',
            'description' => null,
            'status' => 'active',
        ]);
        $brand = Brand::create([
            'name' => 'Media Test Brand',
            'description' => null,
            'status' => 'active',
        ]);

        $product = app(AdminProductService::class)->create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'name' => 'Media Test Product',
            'part_number' => 'MEDIA-001',
            'price' => 120,
            'description' => null,
            'availability_status' => 'active',
            'status' => 'active',
            'image' => UploadedFile::fake()->create('media-product.png', 20, 'image/png'),
        ], $admin);

        $this->assertDatabaseHas('media_assets', [
            'purpose' => MediaAsset::PURPOSE_PRODUCT_IMAGE,
            'linked_type' => 'product',
            'linked_id' => $product->id,
            'cloudinary_public_id' => 'ald-motorshop/products/fake-1',
            'status' => MediaAsset::STATUS_ACTIVE,
        ]);
    }

    public function test_orphan_delete_and_cleanup_retry_are_server_controlled(): void
    {
        $admin = $this->createUser('admin');
        $cloudinary = app(CloudinaryService::class);
        $asset = MediaAsset::create([
            'cloudinary_public_id' => 'ald-motorshop/orphan-1',
            'secure_url' => 'https://res.cloudinary.com/test/image/upload/orphan-1.jpg',
            'purpose' => MediaAsset::PURPOSE_MESSAGE_ATTACHMENT,
            'linked_type' => 'message',
            'linked_id' => 999,
            'status' => MediaAsset::STATUS_ORPHANED,
            'uploaded_at' => now(),
        ]);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson('/api/admin/media/'.$asset->id)
            ->assertOk()
            ->assertJsonPath('media.status', MediaAsset::STATUS_DELETED);

        $this->assertContains('ald-motorshop/orphan-1', $cloudinary->deletions);

        $retryAsset = MediaAsset::create([
            'cloudinary_public_id' => 'ald-motorshop/retry-1',
            'secure_url' => 'https://res.cloudinary.com/test/image/upload/retry-1.jpg',
            'purpose' => MediaAsset::PURPOSE_PRODUCT_IMAGE,
            'linked_type' => 'product',
            'linked_id' => 998,
            'status' => MediaAsset::STATUS_CLEANUP_FAILED,
            'cleanup_error' => 'Provider unavailable.',
            'uploaded_at' => now(),
        ]);
        $cloudinary->failDeletes = true;

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/media/'.$retryAsset->id.'/retry-cleanup')
            ->assertOk()
            ->assertJsonPath('media.status', MediaAsset::STATUS_CLEANUP_FAILED);

        $cloudinary->failDeletes = false;

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/media/'.$retryAsset->id.'/retry-cleanup')
            ->assertOk()
            ->assertJsonPath('media.status', MediaAsset::STATUS_DELETED);
    }

    public function test_permanent_product_archive_cleanup_updates_media_history(): void
    {
        $admin = $this->createUser('admin');
        $category = Category::create([
            'name' => 'Archive Media Category',
            'description' => null,
            'status' => 'active',
        ]);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Archive Media Product',
            'part_number' => 'MEDIA-ARCHIVE-001',
            'brand' => 'Honda',
            'description' => null,
            'price' => 100,
            'img_url' => 'https://res.cloudinary.com/test/image/upload/archive-1.jpg',
            'img_public_id' => 'ald-motorshop/products/archive-1',
            'availability_status' => 'active',
            'status' => 'active',
        ]);
        $asset = MediaAsset::create([
            'cloudinary_public_id' => $product->img_public_id,
            'secure_url' => $product->img_url,
            'purpose' => MediaAsset::PURPOSE_PRODUCT_IMAGE,
            'linked_type' => 'product',
            'linked_id' => $product->id,
            'status' => MediaAsset::STATUS_ACTIVE,
            'uploaded_at' => now(),
        ]);
        AdminArchive::create([
            'archive_type' => 'product',
            'archive_id' => $product->id,
            'archived_by' => $admin->id,
            'archived_at' => now(),
        ]);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson('/api/admin/archive/product/'.$product->id)
            ->assertOk();

        $this->assertDatabaseHas('media_assets', [
            'id' => $asset->id,
            'status' => MediaAsset::STATUS_DELETED,
        ]);
    }

    private function createUser(string $role): User
    {
        return User::create([
            'name' => ucfirst($role).' Media User',
            'email' => $role.'-media-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => $role,
        ]);
    }
}
