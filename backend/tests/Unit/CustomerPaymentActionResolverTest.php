<?php

namespace Tests\Unit;

use App\Models\OrderRequest;
use App\Models\Payment;
use App\Services\CustomerPaymentActionResolver;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class CustomerPaymentActionResolverTest extends TestCase
{
    /**
     * @return array<string, array{string, string, string, array<string, bool>}>
     */
    public static function paymentStates(): array
    {
        return [
            'confirmed unpaid online payment' => [
                'confirmed',
                Payment::METHOD_ONLINE_PAYMENT,
                Payment::STATUS_UNPAID,
                [
                    'can_view_instructions' => true,
                    'can_upload_proof' => true,
                    'can_reupload_proof' => false,
                    'can_view_submitted_proof' => false,
                ],
            ],
            'pending unpaid online payment' => [
                'pending',
                Payment::METHOD_ONLINE_PAYMENT,
                Payment::STATUS_UNPAID,
                [
                    'can_view_instructions' => false,
                    'can_upload_proof' => false,
                    'can_reupload_proof' => false,
                    'can_view_submitted_proof' => false,
                ],
            ],
            'under review unpaid online payment' => [
                'under_review',
                Payment::METHOD_ONLINE_PAYMENT,
                Payment::STATUS_UNPAID,
                [
                    'can_view_instructions' => false,
                    'can_upload_proof' => false,
                    'can_reupload_proof' => false,
                    'can_view_submitted_proof' => false,
                ],
            ],
            'waiting online payment with proof' => [
                'confirmed',
                Payment::METHOD_ONLINE_PAYMENT,
                Payment::STATUS_WAITING_FOR_VERIFICATION,
                [
                    'can_view_instructions' => false,
                    'can_upload_proof' => false,
                    'can_reupload_proof' => false,
                    'can_view_submitted_proof' => true,
                ],
            ],
            'failed online payment can be resubmitted' => [
                'pending',
                Payment::METHOD_ONLINE_PAYMENT,
                Payment::STATUS_FAILED,
                [
                    'can_view_instructions' => true,
                    'can_upload_proof' => true,
                    'can_reupload_proof' => true,
                    'can_view_submitted_proof' => false,
                ],
            ],
            'paid online payment' => [
                'confirmed',
                Payment::METHOD_ONLINE_PAYMENT,
                Payment::STATUS_PAID,
                [
                    'can_view_instructions' => false,
                    'can_upload_proof' => false,
                    'can_reupload_proof' => false,
                    'can_view_submitted_proof' => false,
                ],
            ],
            'pay at pickup' => [
                'confirmed',
                Payment::METHOD_PAY_AT_PICKUP,
                Payment::STATUS_UNPAID,
                [
                    'can_view_instructions' => false,
                    'can_upload_proof' => false,
                    'can_reupload_proof' => false,
                    'can_view_submitted_proof' => false,
                ],
            ],
        ];
    }

    /** @param array<string, bool> $expected */
    #[DataProvider('paymentStates')]
    public function test_payment_capabilities_are_derived_from_order_and_payment_state(
        string $orderStatus,
        string $paymentMethod,
        string $paymentStatus,
        array $expected,
    ): void {
        $order = new OrderRequest(['order_status' => $orderStatus]);
        $payment = new Payment([
            'payment_method' => $paymentMethod,
            'payment_status' => $paymentStatus,
            'proof_image_url' => $paymentStatus === Payment::STATUS_WAITING_FOR_VERIFICATION
                ? 'https://example.com/proof.png'
                : null,
        ]);

        $this->assertSame(
            $expected,
            app(CustomerPaymentActionResolver::class)->resolve($order, $payment),
        );
    }
}
