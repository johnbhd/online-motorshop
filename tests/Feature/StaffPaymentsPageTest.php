<?php

namespace Tests\Feature;

use Tests\TestCase;

class StaffPaymentsPageTest extends TestCase
{
    public function test_staff_payments_page_is_available(): void
    {
        $response = $this->get('/staff/payments');

        $response
            ->assertOk()
            ->assertSee('data-staff-payments', false)
            ->assertSee('Customer Payments')
            ->assertDontSee('data-payment-review-dialog', false)
            ->assertDontSee('data-payment-proof-modal', false)
            ->assertDontSee('gcash.jpg');
    }

    public function test_staff_payments_data_returns_demo_payments(): void
    {
        $response = $this->getJson('/staff/payments/data');

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
