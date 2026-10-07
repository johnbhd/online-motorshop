<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Customer;
use App\Models\OrderRequest;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CustomerPaymentProofApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_confirmed_customer_can_submit_valid_online_payment_proof(): void
    {
        Storage::fake('public');
        [$user, $customer] = $this->createCustomer('payment-proof@example.com');
        $order = $this->createOrder($customer, 'confirmed', Payment::METHOD_ONLINE_PAYMENT);
        $token = $user->createToken('payment-proof-test')->plainTextToken;

        $response = $this->postProof($token, $order->order_reference, $this->validProof());

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'Payment proof submitted for staff verification.')
            ->assertJsonPath('order.payment.status', Payment::STATUS_WAITING_FOR_VERIFICATION)
            ->assertJsonPath('order.payment.proof_image_url', fn (mixed $value): bool => is_string($value));

        $payment = $order->payments()->firstOrFail();

        $this->assertSame(Payment::STATUS_WAITING_FOR_VERIFICATION, $payment->payment_status);
        $this->assertNotNull($payment->proof_image_url);
        Storage::disk('public')->assertExists(
            str_replace('/storage/', '', (string) parse_url($payment->proof_image_url, PHP_URL_PATH)),
        );
    }

    public function test_pending_online_order_cannot_accept_payment_proof(): void
    {
        [$user, $customer] = $this->createCustomer('pending-payment@example.com');
        $order = $this->createOrder($customer, 'pending', Payment::METHOD_ONLINE_PAYMENT);

        $this->postProof(
            $user->createToken('pending-payment-test')->plainTextToken,
            $order->order_reference,
            $this->validProof(),
        )
            ->assertUnprocessable()
            ->assertJsonValidationErrors('payment');
    }

    public function test_pay_at_pickup_order_cannot_accept_payment_proof(): void
    {
        [$user, $customer] = $this->createCustomer('pickup-payment@example.com');
        $order = $this->createOrder($customer, 'confirmed', Payment::METHOD_PAY_AT_PICKUP);

        $this->postProof(
            $user->createToken('pickup-payment-test')->plainTextToken,
            $order->order_reference,
            $this->validProof(),
        )
            ->assertUnprocessable()
            ->assertJsonValidationErrors('payment');
    }

    public function test_customer_cannot_submit_proof_to_another_customers_order(): void
    {
        [$user, $customer] = $this->createCustomer('owner-payment@example.com');
        [, $otherCustomer] = $this->createCustomer('other-payment@example.com');
        $order = $this->createOrder($otherCustomer, 'confirmed', Payment::METHOD_ONLINE_PAYMENT);

        $this->postProof(
            $user->createToken('owner-payment-test')->plainTextToken,
            $order->order_reference,
            $this->validProof(),
        )
            ->assertNotFound();
    }

    public function test_paid_or_waiting_payment_cannot_accept_a_duplicate_proof(): void
    {
        [$user, $customer] = $this->createCustomer('duplicate-payment@example.com');
        $order = $this->createOrder($customer, 'confirmed', Payment::METHOD_ONLINE_PAYMENT, Payment::STATUS_WAITING_FOR_VERIFICATION);
        $token = $user->createToken('duplicate-payment-test')->plainTextToken;

        $this->postProof($token, $order->order_reference, $this->validProof())
            ->assertUnprocessable()
            ->assertJsonValidationErrors('payment');

        $order->payments()->update(['payment_status' => Payment::STATUS_PAID]);

        $this->postProof($token, $order->order_reference, $this->validProof())
            ->assertUnprocessable()
            ->assertJsonValidationErrors('payment');
    }

    public function test_failed_proof_can_be_replaced_for_an_active_order(): void
    {
        Storage::fake('public');
        [$user, $customer] = $this->createCustomer('failed-payment@example.com');
        $order = $this->createOrder($customer, 'confirmed', Payment::METHOD_ONLINE_PAYMENT, Payment::STATUS_FAILED);

        $this->postProof(
            $user->createToken('failed-payment-test')->plainTextToken,
            $order->order_reference,
            $this->validProof('replacement.png'),
        )
            ->assertCreated()
            ->assertJsonPath('order.payment.status', Payment::STATUS_WAITING_FOR_VERIFICATION);
    }

    public function test_invalid_file_is_rejected(): void
    {
        [$user, $customer] = $this->createCustomer('invalid-payment@example.com');
        $order = $this->createOrder($customer, 'confirmed', Payment::METHOD_ONLINE_PAYMENT);

        $this->postProof(
            $user->createToken('invalid-payment-test')->plainTextToken,
            $order->order_reference,
            UploadedFile::fake()->create('receipt.pdf', 100, 'application/pdf'),
        )
            ->assertUnprocessable()
            ->assertJsonValidationErrors('proof');
    }

    public function test_cancelled_order_cannot_accept_payment_proof(): void
    {
        [$user, $customer] = $this->createCustomer('cancelled-payment@example.com');
        $order = $this->createOrder($customer, 'cancelled', Payment::METHOD_ONLINE_PAYMENT);

        $this->postProof(
            $user->createToken('cancelled-payment-test')->plainTextToken,
            $order->order_reference,
            $this->validProof(),
        )
            ->assertUnprocessable()
            ->assertJsonValidationErrors('payment');
    }

    /** @return array{0: User, 1: Customer} */
    private function createCustomer(string $email): array
    {
        $user = User::create([
            'name' => 'Payment Customer',
            'email' => $email,
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'customer',
        ]);
        $customer = Customer::create([
            'user_id' => $user->id,
            'full_name' => 'Payment Customer',
            'contact_number' => '09171234567',
            'email' => $email,
        ]);

        return [$user, $customer];
    }

    private function createOrder(
        Customer $customer,
        string $status,
        string $paymentMethod,
        string $paymentStatus = Payment::STATUS_UNPAID,
    ): OrderRequest {
        $branch = Branch::create([
            'name' => 'Payment Test Branch '.uniqid(),
            'address' => 'Payment Test Address',
            'contact_number' => '09170000000',
            'pickup_available' => true,
            'status' => 'active',
        ]);
        $order = OrderRequest::create([
            'order_reference' => 'ALD-PAY-'.strtoupper(substr(uniqid(), -8)),
            'customer_id' => $customer->id,
            'branch_id' => $branch->id,
            'fulfillment_type' => 'pickup',
            'order_status' => $status,
            'subtotal' => 500,
            'delivery_fee' => 0,
            'total_amount' => 500,
        ]);
        $order->payments()->create([
            'payment_method' => $paymentMethod,
            'amount' => 500,
            'payment_status' => $paymentStatus,
        ]);

        return $order->fresh();
    }

    private function postProof(string $token, string $reference, UploadedFile $file)
    {
        return $this->withToken($token)
            ->withHeader('Accept', 'application/json')
            ->post('/api/customer/orders/'.$reference.'/payment-proof', [
                'proof' => $file,
            ]);
    }

    private function validProof(string $filename = 'receipt.png'): UploadedFile
    {
        $contents = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
            true,
        );

        return UploadedFile::fake()->createWithContent($filename, $contents ?: '');
    }
}
