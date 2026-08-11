<?php

namespace Tests\Feature;

use Tests\TestCase;

class StaffOrdersPageTest extends TestCase
{
    public function test_staff_orders_page_is_available(): void
    {
        $response = $this->get('/staff/orders');

        $response
            ->assertOk()
            ->assertSee('data-staff-orders', false)
            ->assertSee('Customer Orders');
    }

    public function test_staff_orders_data_returns_demo_orders(): void
    {
        $response = $this->getJson('/staff/orders/data');

        $response
            ->assertOk()
            ->assertJsonPath('summary.total', 48)
            ->assertJsonCount(8, 'orders')
            ->assertJsonPath('orders.0.reference', 'ALD-2026-000128');
    }
}
