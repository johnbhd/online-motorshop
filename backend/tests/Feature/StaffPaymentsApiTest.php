<?php

namespace Tests\Feature;

use Tests\TestCase;

class StaffPaymentsApiTest extends TestCase
{
    public function test_staff_payments_data_returns_demo_payments(): void
    {
        $response = $this->getJson('/api/staff/payments/data');

        $response
            ->assertOk()
            ->assertJsonPath('summary.total', 36)
            ->assertJsonCount(8, 'payments')
            ->assertJsonPath(
                'payments.0.order_reference',
                'ALD-2026-000127',
            )
            ->assertJsonPath(
                'payments.0.payment_reference',
                'PAY-873421',
            );
    }
}
