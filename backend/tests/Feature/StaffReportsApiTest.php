<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Customer;
use App\Models\OrderRequest;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StaffReportsApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_reports_require_staff_access_and_a_branch_assignment(): void
    {
        $this->getJson('/api/staff/reports/data')->assertUnauthorized();

        $admin = $this->createUser('admin');
        $this->withToken($admin->createToken('staff-reports-admin')->plainTextToken)
            ->getJson('/api/staff/reports/data')
            ->assertForbidden();

        $unassignedStaff = $this->createUser('staff');
        $this->withToken($unassignedStaff->createToken('staff-reports-unassigned')->plainTextToken)
            ->getJson('/api/staff/reports/data')
            ->assertForbidden();

        $branch = $this->createBranch('Reports Branch');
        $staff = $this->createUser('staff', $branch);

        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/staff/reports/data?from=2026-10-31&to=2026-10-01&payment_status=invalid')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['to', 'payment_status']);
    }

    public function test_reports_are_real_branch_scoped_and_paginated(): void
    {
        $branch = $this->createBranch('Reports Main Branch');
        $otherBranch = $this->createBranch('Reports Other Branch');
        $staff = $this->createUser('staff', $branch);
        $customer = $this->createCustomer('Reports Customer');
        $product = $this->createProduct('REPORT-001', 'Report Brake Pad', 150);
        $otherProduct = $this->createProduct('REPORT-002', 'Report Chain Kit', 300);

        $completed = $this->createOrder(
            $customer,
            $product,
            'ALD-REPORT-001',
            $branch,
            'completed',
            'pickup',
            300,
            '2026-10-05 10:00:00',
        );
        $completed->items()->delete();
        $completed->items()->createMany([
            [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'unit_price' => 150,
                'quantity' => 2,
                'subtotal' => 300,
            ],
        ]);
        $completed->payments()->create([
            'payment_method' => Payment::METHOD_PAY_AT_PICKUP,
            'amount' => 300,
            'payment_status' => Payment::STATUS_PAID,
        ]);
        $completed->payments()->create([
            'payment_method' => Payment::METHOD_PAY_AT_PICKUP,
            'amount' => 300,
            'payment_status' => Payment::STATUS_WAITING_FOR_VERIFICATION,
        ]);
        $completed->pickupRequest()->create([
            'branch_id' => $branch->id,
            'pickup_status' => 'completed',
        ]);

        $pending = $this->createOrder(
            $customer,
            $otherProduct,
            'ALD-REPORT-002',
            $branch,
            'pending',
            'delivery',
            300,
            '2026-10-06 11:00:00',
        );
        $pending->payments()->create([
            'payment_method' => Payment::METHOD_ONLINE_PAYMENT,
            'amount' => 300,
            'payment_status' => Payment::STATUS_WAITING_FOR_VERIFICATION,
        ]);
        $pending->deliveryRequest()->create([
            'branch_id' => $branch->id,
            'delivery_address' => 'Reports delivery address',
            'delivery_status' => 'waiting_for_booking',
        ]);

        $cancelled = $this->createOrder(
            $customer,
            $product,
            'ALD-REPORT-003',
            $branch,
            'cancelled',
            'pickup',
            150,
            '2026-10-07 12:00:00',
        );
        $cancelled->payments()->create([
            'payment_method' => Payment::METHOD_PAY_AT_PICKUP,
            'amount' => 150,
            'payment_status' => Payment::STATUS_UNPAID,
        ]);

        $hidden = $this->createOrder(
            $customer,
            $product,
            'ALD-REPORT-HIDDEN',
            $otherBranch,
            'completed',
            'pickup',
            999,
            '2026-10-08 13:00:00',
        );
        $hidden->payments()->create([
            'payment_method' => Payment::METHOD_PAY_AT_PICKUP,
            'amount' => 999,
            'payment_status' => Payment::STATUS_PAID,
        ]);
        $hidden->pickupRequest()->create([
            'branch_id' => $otherBranch->id,
            'pickup_status' => 'completed',
        ]);

        $token = $staff->createToken('staff-reports-test')->plainTextToken;
        $response = $this->withToken($token)
            ->getJson('/api/staff/reports/data?from=2026-10-01&to=2026-10-31')
            ->assertOk()
            ->assertJsonPath('filters.branch.id', $branch->id)
            ->assertJsonPath('summary.order_requests', 3)
            ->assertJsonPath('summary.completed_orders', 1)
            ->assertJsonPath('summary.in_progress_orders', 1)
            ->assertJsonPath('summary.cancelled_or_rejected_orders', 1)
            ->assertJsonPath('summary.completed_sales_value', 0)
            ->assertJsonPath('summary.verified_payments', 0)
            ->assertJsonPath('summary.payment_attention', 3)
            ->assertJsonPath('summary.pickup_orders', 2)
            ->assertJsonPath('summary.delivery_orders', 1)
            ->assertJsonPath('fulfillment.0.orders', 2)
            ->assertJsonPath('fulfillment.0.completed_orders', 1)
            ->assertJsonPath('fulfillment.1.orders', 1)
            ->assertJsonPath('order_statuses.0.value', 1)
            ->assertJsonPath('payments.statuses.0.value', 1)
            ->assertJsonPath('payments.statuses.2.value', 2)
            ->assertJsonPath('payments.statuses.3.value', 0)
            ->assertJsonPath('top_products.0.part_number', 'REPORT-001')
            ->assertJsonPath('top_products.0.units_sold', 2)
            ->assertJsonPath('top_products.0.revenue', 300)
            ->assertJsonPath('meta.total', 3)
            ->assertJsonMissing(['reference' => $hidden->order_reference]);

        $response->assertJsonCount(31, 'order_trend');

        $this->withToken($token)
            ->getJson('/api/staff/reports/data?from=2026-10-01&to=2026-10-31&per_page=1&page=2')
            ->assertOk()
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.last_page', 3)
            ->assertJsonCount(1, 'orders');
    }

    private function createUser(string $role, ?Branch $branch = null): User
    {
        return User::create([
            'name' => ucfirst($role).' Reports User',
            'email' => $role.'-reports-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'branch_id' => $branch?->id,
            'status' => 'active',
            'role' => $role,
        ]);
    }

    private function createCustomer(string $name): Customer
    {
        return Customer::create([
            'full_name' => $name,
            'contact_number' => '09170000000',
            'email' => strtolower(str_replace(' ', '-', $name)).'@example.com',
        ]);
    }

    private function createProduct(string $partNumber, string $name, int $price): Product
    {
        $category = Category::create([
            'name' => 'Reports Category '.$partNumber,
        ]);

        return Product::create([
            'part_number' => $partNumber,
            'name' => $name,
            'description' => 'Reports test product',
            'category_id' => $category->id,
            'brand' => 'Reports Brand',
            'price' => $price,
            'img_url' => 'reports-test.png',
            'availability_status' => 'active',
            'status' => 'active',
        ]);
    }

    private function createOrder(
        Customer $customer,
        Product $product,
        string $reference,
        Branch $branch,
        string $status,
        string $fulfillment,
        int $total,
        string $createdAt,
    ): OrderRequest {
        $order = OrderRequest::create([
            'order_reference' => $reference,
            'customer_id' => $customer->id,
            'branch_id' => $branch->id,
            'fulfillment_type' => $fulfillment,
            'order_status' => $status,
            'subtotal' => $total,
            'delivery_fee' => 0,
            'total_amount' => $total,
        ]);
        $order->forceFill([
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ])->saveQuietly();
        $order->items()->create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'unit_price' => $total,
            'quantity' => 1,
            'subtotal' => $total,
        ]);

        return $order->fresh();
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
