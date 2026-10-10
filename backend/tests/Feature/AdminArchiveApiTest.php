<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Customer;
use App\Models\OrderRequest;
use App\Models\Payment;
use App\Models\PickupRequest;
use App\Models\Product;
use App\Models\User;
use App\Services\CloudinaryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\Fakes\FakeCloudinaryService;
use Tests\TestCase;

class AdminArchiveApiTest extends TestCase
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

    public function test_order_archive_restore_preserves_identity_relationships_and_business_state(): void
    {
        $admin = $this->createUser('admin');
        $branch = $this->createBranch();
        $staff = $this->createUser('staff', $branch);
        $customer = $this->createCustomer('Archive Customer');
        $category = Category::create(['name' => 'Archive Parts', 'status' => 'active']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Archive Product',
            'part_number' => 'ARCHIVE-001',
            'brand' => 'ALD',
            'price' => 250,
            'img_url' => 'https://res.cloudinary.com/test/archive.png',
            'img_public_id' => 'ald-motorshop/products/archive',
            'availability_status' => 'inactive',
            'status' => 'inactive',
        ]);
        $order = OrderRequest::create([
            'order_reference' => 'ALD-ARCHIVE-001',
            'customer_id' => $customer->id,
            'branch_id' => $branch->id,
            'assigned_staff_id' => $staff->id,
            'fulfillment_type' => 'pickup',
            'order_status' => 'confirmed',
            'subtotal' => 250,
            'delivery_fee' => 0,
            'total_amount' => 250,
        ]);
        $item = $order->items()->create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'unit_price' => 250,
            'quantity' => 1,
            'subtotal' => 250,
        ]);
        $payment = $order->payments()->create([
            'payment_method' => Payment::METHOD_PAY_AT_PICKUP,
            'amount' => 250,
            'payment_status' => Payment::STATUS_UNPAID,
        ]);
        $pickup = PickupRequest::create([
            'order_id' => $order->id,
            'branch_id' => $branch->id,
            'assigned_staff_id' => $staff->id,
            'pickup_status' => 'ready_for_pickup',
        ]);
        $createdAt = $order->created_at?->toISOString();

        $this->adminRequest($admin)
            ->postJson('/api/admin/archive/order/'.$order->id)
            ->assertCreated()
            ->assertJsonPath('archive.id', $order->id)
            ->assertJsonPath('archive.destination', '/admin/orders');

        $this->adminRequest($admin)
            ->getJson('/api/admin/orders')
            ->assertOk()
            ->assertJsonPath('meta.total', 0);

        $this->adminRequest($admin)
            ->postJson('/api/admin/archive/order/'.$order->id.'/restore')
            ->assertOk()
            ->assertJsonPath('archive.id', $order->id)
            ->assertJsonPath('archive.record.reference', $order->order_reference);

        $this->assertDatabaseMissing('admin_archives', [
            'archive_type' => 'order',
            'archive_id' => $order->id,
        ]);

        $order->refresh();
        $this->assertSame($createdAt, $order->created_at?->toISOString());
        $this->assertSame('ALD-ARCHIVE-001', $order->order_reference);
        $this->assertSame('confirmed', $order->order_status);
        $this->assertSame($customer->id, $order->customer_id);
        $this->assertSame($branch->id, $order->branch_id);
        $this->assertSame($staff->id, $order->assigned_staff_id);
        $this->assertSame($item->id, $order->items()->firstOrFail()->id);
        $this->assertSame($payment->id, $order->payments()->firstOrFail()->id);
        $this->assertSame('unpaid', $order->payments()->firstOrFail()->payment_status);
        $this->assertSame($pickup->id, $order->pickupRequest()->firstOrFail()->id);
        $this->assertSame('ready_for_pickup', $order->pickupRequest()->firstOrFail()->pickup_status);

        $this->adminRequest($admin)
            ->getJson('/api/admin/orders')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('orders.0.id', $order->id);
    }

    public function test_product_payment_and_customer_restore_preserve_state_and_media_metadata(): void
    {
        $admin = $this->createUser('admin');
        $customerUser = $this->createUser('customer');
        $customerUser->update(['status' => 'suspended']);
        $customer = Customer::create([
            'user_id' => $customerUser->id,
            'full_name' => $customerUser->name,
            'contact_number' => '09170000001',
            'email' => $customerUser->email,
        ]);
        $category = Category::create(['name' => 'Archive Product Category', 'status' => 'active']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Media Product',
            'part_number' => 'ARCHIVE-MEDIA-001',
            'brand' => 'ALD',
            'price' => 500,
            'img_url' => 'https://res.cloudinary.com/test/media.png',
            'img_public_id' => 'ald-motorshop/products/media',
            'availability_status' => 'inactive',
            'status' => 'inactive',
        ]);
        $order = OrderRequest::create([
            'order_reference' => 'ALD-ARCHIVE-MEDIA-001',
            'customer_id' => $customer->id,
            'fulfillment_type' => 'pickup',
            'order_status' => 'completed',
            'subtotal' => 500,
            'delivery_fee' => 0,
            'total_amount' => 500,
        ]);
        $payment = $order->payments()->create([
            'payment_method' => Payment::METHOD_ONLINE_PAYMENT,
            'amount' => 500,
            'payment_reference' => 'PAY-ARCHIVE-001',
            'proof_image_url' => 'https://res.cloudinary.com/test/proof.png',
            'proof_image_public_id' => 'ald-motorshop/payments/proof',
            'payment_status' => Payment::STATUS_PAID,
        ]);
        $cloudinary = app(CloudinaryService::class);

        $this->adminRequest($admin)
            ->postJson('/api/admin/archive/product/'.$product->id)
            ->assertCreated();
        $this->adminRequest($admin)
            ->postJson('/api/admin/archive/product/'.$product->id.'/restore')
            ->assertOk()
            ->assertJsonPath('archive.record.reference', 'ARCHIVE-MEDIA-001');

        $this->adminRequest($admin)
            ->postJson('/api/admin/archive/payment/'.$payment->id)
            ->assertCreated();
        $this->adminRequest($admin)
            ->postJson('/api/admin/archive/payment/'.$payment->id.'/restore')
            ->assertOk()
            ->assertJsonPath('archive.record.status', Payment::STATUS_PAID);

        $this->adminRequest($admin)
            ->postJson('/api/admin/archive/customer/'.$customer->id)
            ->assertCreated();
        $this->adminRequest($admin)
            ->postJson('/api/admin/archive/customer/'.$customer->id.'/restore')
            ->assertOk();

        $product->refresh();
        $payment->refresh();
        $customerUser->refresh();

        $this->assertSame('inactive', $product->status);
        $this->assertSame('https://res.cloudinary.com/test/media.png', $product->img_url);
        $this->assertSame('ald-motorshop/products/media', $product->img_public_id);
        $this->assertSame(Payment::STATUS_PAID, $payment->payment_status);
        $this->assertSame('ald-motorshop/payments/proof', $payment->proof_image_public_id);
        $this->assertSame('suspended', $customerUser->status);
        $this->assertSame([], $cloudinary->uploads);
        $this->assertSame([], $cloudinary->deletions);
    }

    public function test_archive_and_restore_are_admin_only_and_permanent_delete_is_explicit(): void
    {
        $admin = $this->createUser('admin');
        $staff = $this->createUser('staff');
        $customer = $this->createUser('customer');
        $category = Category::create(['name' => 'Deletable Category', 'status' => 'active']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Deletable Product',
            'part_number' => 'ARCHIVE-DELETE-001',
            'brand' => 'ALD',
            'price' => 100,
            'img_url' => 'https://example.com/delete.png',
            'img_public_id' => 'ald-motorshop/products/delete',
            'availability_status' => 'active',
            'status' => 'active',
        ]);

        $this->adminRequest($admin)
            ->postJson('/api/admin/archive/product/'.$product->id)
            ->assertCreated();

        $this->actingAs($staff, 'sanctum')
            ->postJson('/api/admin/archive/product/'.$product->id.'/restore')
            ->assertForbidden();
        $this->actingAs($customer, 'sanctum')
            ->postJson('/api/admin/archive/product/'.$product->id.'/restore')
            ->assertForbidden();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson('/api/admin/archive/product/'.$product->id)
            ->assertOk()
            ->assertJsonPath('archive.id', $product->id);

        $this->assertDatabaseMissing('products', ['id' => $product->id]);
        $this->assertDatabaseMissing('admin_archives', [
            'archive_type' => 'product',
            'archive_id' => $product->id,
        ]);
        $this->adminRequest($admin)
            ->postJson('/api/admin/archive/product/'.$product->id.'/restore')
            ->assertNotFound();
    }

    private function adminRequest(User $admin)
    {
        return $this->withToken($admin->createToken('archive-admin')->plainTextToken);
    }

    private function createUser(string $role, ?Branch $branch = null): User
    {
        return User::create([
            'name' => ucfirst($role).' Archive User',
            'email' => $role.'-archive-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'branch_id' => $branch?->id,
            'status' => 'active',
            'role' => $role,
        ]);
    }

    private function createBranch(): Branch
    {
        return Branch::create([
            'name' => 'Archive Branch',
            'address' => 'Archive address',
            'contact_number' => '09170000000',
            'pickup_available' => true,
            'status' => 'active',
        ]);
    }

    private function createCustomer(string $name): Customer
    {
        return Customer::create([
            'full_name' => $name,
            'contact_number' => '09171111111',
            'email' => strtolower(str_replace(' ', '.', $name)).'@example.com',
        ]);
    }
}
