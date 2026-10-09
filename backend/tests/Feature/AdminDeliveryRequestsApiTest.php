<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Customer;
use App\Models\DeliveryRequest;
use App\Models\OrderRequest;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminDeliveryRequestsApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_admin_delivery_overview_is_system_wide_searchable_filterable_and_paginated(): void
    {
        $admin = $this->createUser('admin');
        $manila = $this->createBranch('Manila Delivery Branch');
        $makati = $this->createBranch('Makati Delivery Branch');
        $staff = $this->createUser('staff', $manila, 'Assigned Delivery Staff');
        $first = $this->createDelivery('Delivery Customer One', $manila, 'ALD-2026-DEL-001', 'booked', $staff);
        $second = $this->createDelivery('Delivery Customer Two', $makati, 'ALD-2026-DEL-002', 'delivered');
        $pickup = $this->createDelivery('Pickup Must Be Excluded', $manila, 'ALD-2026-PICK-001', 'in_transit', $staff, 'pickup');

        $first->payments()->create([
            'payment_method' => 'Online Payment',
            'amount' => 250,
            'payment_reference' => 'PAY-DEL-001',
            'payment_status' => 'waiting_for_verification',
        ]);
        $second->deliveryRequest->update(['delivered_at' => now()]);

        $this->requestAs($admin)
            ->getJson('/api/admin/delivery-requests?search=ALD-2026-DEL-001&status=booked&per_page=1')
            ->assertOk()
            ->assertJsonPath('summary.total', 2)
            ->assertJsonPath('summary.active', 1)
            ->assertJsonPath('summary.booked', 1)
            ->assertJsonPath('summary.delivered', 1)
            ->assertJsonPath('summary.delivered_today', 1)
            ->assertJsonCount(1, 'delivery_requests')
            ->assertJsonPath('delivery_requests.0.order_reference', 'ALD-2026-DEL-001')
            ->assertJsonPath('delivery_requests.0.payment.status', 'waiting_for_verification')
            ->assertJsonPath('delivery_requests.0.booking_reference', null)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonCount(2, 'branch_summary');

        $this->requestAs($admin)
            ->getJson('/api/admin/delivery-requests?branch_id='.$makati->id)
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('delivery_requests.0.order_reference', 'ALD-2026-DEL-002');

        $this->requestAs($admin)
            ->getJson('/api/admin/delivery-requests?assigned_staff_id='.$staff->id)
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('delivery_requests.0.order_reference', 'ALD-2026-DEL-001');

        $this->requestAs($admin)
            ->getJson('/api/admin/delivery-requests?per_page=1')
            ->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonCount(1, 'delivery_requests');

        $this->requestAs($admin)
            ->getJson('/api/admin/delivery-requests/data?status=delivered')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('delivery_requests.0.order_reference', 'ALD-2026-DEL-002');

        $this->assertDatabaseHas('delivery_requests', ['id' => $pickup->deliveryRequest->id]);
    }

    public function test_admin_can_view_persisted_delivery_details_and_order_item_snapshots_read_only(): void
    {
        $admin = $this->createUser('admin');
        $branch = $this->createBranch('Admin Delivery Detail Branch');
        $staff = $this->createUser('staff', $branch, 'Delivery Detail Staff');
        $order = $this->createDelivery('Delivery Detail Customer', $branch, 'ALD-2026-DEL-003', 'booked', $staff);
        $delivery = $order->deliveryRequest;
        $delivery->update([
            'booking_reference' => 'LAL-DEL-003',
            'tracking_url' => 'https://tracking.example.test/LAL-DEL-003',
            'rider_name' => 'Rider One',
            'rider_contact' => '09170000001',
            'remarks' => 'Call on arrival',
            'delivery_fee' => 150,
        ]);
        $order->payments()->create([
            'payment_method' => 'Online Payment',
            'amount' => 250,
            'payment_reference' => 'PAY-DEL-003',
            'payment_status' => 'paid',
            'verified_at' => now(),
        ]);
        $order->items()->first()->product->update(['name' => 'Changed current product name']);

        $this->requestAs($admin)
            ->getJson('/api/admin/delivery-requests/'.$delivery->id)
            ->assertOk()
            ->assertJsonPath('delivery_request.order_reference', 'ALD-2026-DEL-003')
            ->assertJsonPath('delivery_request.customer.full_name', 'Delivery Detail Customer')
            ->assertJsonPath('delivery_request.branch.name', 'Admin Delivery Detail Branch')
            ->assertJsonPath('delivery_request.payment.status', 'paid')
            ->assertJsonPath('delivery_request.assigned_staff.name', 'Delivery Detail Staff')
            ->assertJsonPath('delivery_request.delivery_address', '12 Main Street, Barangay San Isidro, Makati City')
            ->assertJsonPath('delivery_request.booking_reference', 'LAL-DEL-003')
            ->assertJsonPath('delivery_request.tracking_url', 'https://tracking.example.test/LAL-DEL-003')
            ->assertJsonPath('delivery_request.rider_name', 'Rider One')
            ->assertJsonPath('delivery_request.order.fulfillment_method', 'delivery')
            ->assertJsonPath('delivery_request.order.items.0.name', 'Test Delivery Product 001')
            ->assertJsonPath('delivery_request.order.items.0.unit_price', 250)
            ->assertJsonPath('delivery_request.allowed_statuses', []);

        $this->requestAs($admin)
            ->getJson('/api/admin/delivery-requests/999999')
            ->assertNotFound();

        $this->requestAs($admin)
            ->patchJson('/api/admin/delivery-requests/'.$delivery->id.'/status', [
                'status' => 'delivered',
            ])
            ->assertNotFound();

        $this->assertDatabaseHas('delivery_requests', [
            'id' => $delivery->id,
            'delivery_status' => 'booked',
            'booking_reference' => 'LAL-DEL-003',
        ]);
    }

    public function test_delivery_overview_requires_admin_role_and_validates_filters(): void
    {
        $this->getJson('/api/admin/delivery-requests')->assertUnauthorized();
        $this->getJson('/api/admin/delivery-requests/data')->assertUnauthorized();
        $this->getJson('/api/admin/delivery-requests/1')->assertUnauthorized();

        $branch = $this->createBranch('Delivery Access Branch');
        $staff = $this->createUser('staff', $branch);
        $customer = $this->createUser('customer');
        $this->requestAs($staff)->getJson('/api/admin/delivery-requests')->assertForbidden();
        $this->requestAs($customer)->getJson('/api/admin/delivery-requests')->assertForbidden();

    }

    public function test_admin_delivery_filters_validate_status_page_size_and_staff_role(): void
    {
        $admin = $this->createUser('admin');
        $customer = $this->createUser('customer');
        $token = $admin->createToken('admin-delivery-filter-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/admin/delivery-requests?status=unknown')
            ->assertUnprocessable();
        $this->withToken($token)
            ->getJson('/api/admin/delivery-requests?per_page=101')
            ->assertUnprocessable();
        $this->withToken($token)
            ->getJson('/api/admin/delivery-requests?assigned_staff_id='.$customer->id)
            ->assertUnprocessable();
    }

    private function requestAs(User $user)
    {
        return $this->withToken($user->createToken('admin-delivery-test')->plainTextToken);
    }

    private function createUser(string $role, ?Branch $branch = null, ?string $name = null): User
    {
        return User::create([
            'name' => $name ?? ucfirst($role).' User',
            'email' => $role.'-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'branch_id' => $branch?->id,
            'status' => 'active',
            'role' => $role,
        ]);
    }

    private function createDelivery(
        string $customerName,
        Branch $branch,
        string $reference,
        string $status = 'waiting_for_booking',
        ?User $staff = null,
        string $fulfillment = 'delivery',
    ): OrderRequest {
        $customer = Customer::create([
            'full_name' => $customerName,
            'contact_number' => '09171111111',
            'email' => strtolower(str_replace(' ', '.', $customerName)).'@example.com',
        ]);
        $category = Category::firstOrCreate(['name' => 'Admin Delivery Parts'], [
            'description' => 'Admin delivery test category',
            'status' => 'active',
        ]);
        $suffix = str_pad((string) (DeliveryRequest::query()->count() + 1), 3, '0', STR_PAD_LEFT);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Test Delivery Product '.$suffix,
            'part_number' => 'DEL-'.$suffix,
            'brand' => 'Test Brand',
            'description' => 'Admin delivery test product',
            'price' => 250,
            'img_url' => 'https://example.com/delivery.png',
            'availability_status' => 'active',
            'status' => 'active',
        ]);
        $order = OrderRequest::create([
            'order_reference' => $reference,
            'customer_id' => $customer->id,
            'branch_id' => $branch->id,
            'fulfillment_type' => $fulfillment,
            'order_status' => 'confirmed',
            'subtotal' => 250,
            'delivery_fee' => 0,
            'total_amount' => 250,
        ]);
        $order->items()->create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'unit_price' => 250,
            'quantity' => 1,
            'subtotal' => 250,
        ]);
        DeliveryRequest::create([
            'order_id' => $order->id,
            'branch_id' => $branch->id,
            'assigned_staff_id' => $staff?->id,
            'delivery_address' => '12 Main Street, Barangay San Isidro, Makati City',
            'delivery_fee' => 0,
            'delivery_status' => $status,
        ]);

        return $order->fresh(['deliveryRequest', 'items.product']);
    }

    private function createBranch(string $name): Branch
    {
        return Branch::create([
            'name' => $name,
            'address' => $name.' address',
            'contact_number' => '09170000000',
            'pickup_available' => true,
            'status' => 'active',
        ]);
    }
}
