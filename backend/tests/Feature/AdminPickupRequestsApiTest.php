<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Customer;
use App\Models\OrderRequest;
use App\Models\PickupRequest;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminPickupRequestsApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_admin_can_oversee_real_pickups_across_branches_with_search_filters_and_pagination(): void
    {
        $admin = $this->createUser('admin');
        $manila = $this->createBranch('Manila Pickup Branch');
        $makati = $this->createBranch('Makati Pickup Branch');
        $staff = $this->createUser('staff', $manila, 'Assigned Pickup Staff');
        $first = $this->createPickup('Pickup Customer', $manila, 'ALD-2026-PICK-001', 'preparing', $staff);
        $second = $this->createPickup('Other Customer', $makati, 'ALD-2026-PICK-002', 'completed');

        $first->payments()->create([
            'payment_method' => 'Pay at Pickup',
            'amount' => 250,
            'payment_status' => 'unpaid',
        ]);

        $this->requestAs($admin)
            ->getJson('/api/admin/pickup-requests?search=Pickup%20Customer&status=preparing&per_page=1')
            ->assertOk()
            ->assertJsonPath('summary.total', 2)
            ->assertJsonPath('summary.active', 1)
            ->assertJsonPath('summary.preparing', 1)
            ->assertJsonPath('summary.completed', 1)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonCount(1, 'pickup_requests')
            ->assertJsonPath('pickup_requests.0.order_reference', 'ALD-2026-PICK-001')
            ->assertJsonPath('pickup_requests.0.payment.status', 'unpaid')
            ->assertJsonPath('pickup_requests.0.assigned_staff.name', 'Assigned Pickup Staff');

        $this->requestAs($admin)
            ->getJson('/api/admin/pickup-requests?branch_id='.$makati->id.'&assigned_staff_id='.$staff->id)
            ->assertOk()
            ->assertJsonPath('meta.total', 0);

        $this->requestAs($admin)
            ->getJson('/api/admin/pickup-requests?per_page=1')
            ->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonCount(1, 'pickup_requests')
            ->assertJsonCount(2, 'branch_summary');

        $this->requestAs($admin)
            ->getJson('/api/admin/pickup-requests/data?status=completed')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('pickup_requests.0.order_reference', 'ALD-2026-PICK-002');
    }

    public function test_admin_can_view_pickup_details_from_persisted_records_and_order_item_snapshots(): void
    {
        $admin = $this->createUser('admin');
        $branch = $this->createBranch('Admin Pickup Detail Branch');
        $staff = $this->createUser('staff', $branch, 'Pickup Detail Staff');
        $order = $this->createPickup('Pickup Detail Customer', $branch, 'ALD-2026-PICK-003', 'ready_for_pickup', $staff);
        $order->payments()->create([
            'payment_method' => 'Online Payment',
            'amount' => 250,
            'payment_reference' => 'PAY-PICK-003',
            'payment_status' => 'paid',
            'verified_at' => now(),
        ]);
        $order->items()->first()->product->update(['name' => 'Renamed current catalog product']);

        $this->requestAs($admin)
            ->getJson('/api/admin/pickup-requests/'.$order->pickupRequest->id)
            ->assertOk()
            ->assertJsonPath('pickup_request.order_reference', 'ALD-2026-PICK-003')
            ->assertJsonPath('pickup_request.customer.full_name', 'Pickup Detail Customer')
            ->assertJsonPath('pickup_request.branch.name', 'Admin Pickup Detail Branch')
            ->assertJsonPath('pickup_request.payment.method', 'Online Payment')
            ->assertJsonPath('pickup_request.payment.status', 'paid')
            ->assertJsonPath('pickup_request.assigned_staff.name', 'Pickup Detail Staff')
            ->assertJsonPath('pickup_request.order.fulfillment_method', 'pickup')
            ->assertJsonPath('pickup_request.order.items.0.name', 'Test Pickup Product 003')
            ->assertJsonPath('pickup_request.order.items.0.unit_price', 250)
            ->assertJsonPath('pickup_request.allowed_statuses', []);

        $this->requestAs($admin)
            ->getJson('/api/admin/pickup-requests/999999')
            ->assertNotFound();
    }

    public function test_admin_pickup_endpoints_require_admin_access_and_status_is_not_admin_mutable(): void
    {
        $this->getJson('/api/admin/pickup-requests')->assertUnauthorized();
        $this->getJson('/api/admin/pickup-requests/data')->assertUnauthorized();
        $this->getJson('/api/admin/pickup-requests/1')->assertUnauthorized();

        $branch = $this->createBranch('Pickup Access Branch');
        $staff = $this->createUser('staff', $branch);
        $customer = $this->createUser('customer');

        $this->requestAs($staff)->getJson('/api/admin/pickup-requests')->assertForbidden();
        $this->requestAs($customer)->getJson('/api/admin/pickup-requests')->assertForbidden();

        $admin = $this->createUser('admin');
        $pickup = $this->createPickup('Read Only Pickup Customer', $branch, 'ALD-2026-PICK-004');
        $this->requestAs($admin)
            ->patchJson('/api/admin/pickup-requests/'.$pickup->pickupRequest->id.'/status', [
                'status' => 'completed',
            ])
            ->assertNotFound();

    }

    public function test_admin_pickup_filters_validate_canonical_status_and_bounded_page_size(): void
    {
        $admin = $this->createUser('admin');
        $token = $admin->createToken('admin-pickup-filter-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/admin/pickup-requests?status=unknown')
            ->assertUnprocessable();
        $this->withToken($token)
            ->getJson('/api/admin/pickup-requests?per_page=101')
            ->assertUnprocessable();
    }

    private function requestAs(User $user)
    {
        return $this->withToken($user->createToken('admin-pickup-test')->plainTextToken);
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

    private function createPickup(
        string $customerName,
        Branch $branch,
        string $reference,
        string $status = 'pending',
        ?User $staff = null,
    ): OrderRequest {
        $customer = Customer::create([
            'full_name' => $customerName,
            'contact_number' => '09171111111',
            'email' => strtolower(str_replace(' ', '.', $customerName)).'@example.com',
        ]);
        $category = Category::firstOrCreate(['name' => 'Admin Pickup Parts'], [
            'description' => 'Admin pickup test category',
            'status' => 'active',
        ]);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Test Pickup Product '.substr($reference, -3),
            'part_number' => 'PICK-'.substr($reference, -3),
            'brand' => 'Test Brand',
            'description' => 'Admin pickup test product',
            'price' => 250,
            'img_url' => 'https://example.com/pickup.png',
            'availability_status' => 'active',
            'status' => 'active',
        ]);
        $order = OrderRequest::create([
            'order_reference' => $reference,
            'customer_id' => $customer->id,
            'branch_id' => $branch->id,
            'fulfillment_type' => 'pickup',
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
        PickupRequest::create([
            'order_id' => $order->id,
            'branch_id' => $branch->id,
            'assigned_staff_id' => $staff?->id,
            'pickup_status' => $status,
            'pickup_date' => '2026-10-15',
            'pickup_time' => '14:30',
        ]);

        return $order->fresh('pickupRequest');
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
