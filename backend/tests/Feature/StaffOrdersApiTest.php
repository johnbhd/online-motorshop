<?php

namespace Tests\Feature;

use Tests\TestCase;

class StaffOrdersApiTest extends TestCase
{
    public function test_staff_orders_data_returns_demo_orders(): void
    {
        $response = $this->getJson('/api/staff/orders/data');

        $response
            ->assertOk()
            ->assertJsonPath('summary.total', 48)
            ->assertJsonCount(8, 'orders')
            ->assertJsonPath('orders.0.reference', 'ALD-2026-000128');
    }
}
