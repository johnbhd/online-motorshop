<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Customer;
use App\Models\DeliveryRequest;
use App\Models\OrderRequest;
use App\Models\PickupRequest;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class OrderRequestCreator
{
    /**
     * Create a pending order request and its fulfillment record atomically.
     *
     * @param  array<string, mixed>  $payload
     */
    public function create(array $payload, ?User $user = null): OrderRequest
    {
        $method = data_get($payload, 'fulfillment.method');
        $branch = $this->resolveBranch(
            (int) data_get($payload, 'fulfillment.branch_id'),
            (string) $method,
        );
        $delivery = $method === 'delivery'
            ? (array) data_get($payload, 'fulfillment.delivery', [])
            : null;
        $deliveryAddress = $delivery ? $this->deliveryAddress($delivery) : null;
        $deliveryRemarks = $delivery ? $this->deliveryRemarks($delivery) : null;

        $requestedItems = (array) ($payload['items'] ?? []);
        $partNumbers = array_map(
            static fn (array $item): string => (string) ($item['part_number'] ?? ''),
            $requestedItems,
        );

        if (count($partNumbers) !== count(array_unique($partNumbers))) {
            throw ValidationException::withMessages([
                'items' => ['Each product part number may only appear once per order.'],
            ]);
        }

        $products = Product::query()
            ->where('status', 'active')
            ->where('availability_status', 'active')
            ->whereIn('part_number', $partNumbers)
            ->get()
            ->keyBy('part_number');

        $missingPartNumbers = array_values(array_filter(
            $partNumbers,
            static fn (string $partNumber): bool => ! $products->has($partNumber),
        ));

        if ($missingPartNumbers !== []) {
            throw ValidationException::withMessages([
                'items' => [
                    'These products are unavailable: '.implode(', ', $missingPartNumbers).'.',
                ],
            ]);
        }

        $calculatedItems = [];
        $subtotalCents = 0;

        foreach ($requestedItems as $requestedItem) {
            $partNumber = (string) $requestedItem['part_number'];
            $quantity = (int) $requestedItem['quantity'];
            $product = $products->get($partNumber);
            $unitPriceCents = $this->moneyToCents((string) $product->price);
            $lineTotalCents = $unitPriceCents * $quantity;
            $subtotalCents += $lineTotalCents;

            $calculatedItems[] = [
                'product' => $product,
                'quantity' => $quantity,
                'unit_price' => $this->moneyFromCents($unitPriceCents),
                'subtotal' => $this->moneyFromCents($lineTotalCents),
            ];
        }

        if ($subtotalCents > 9999999999) {
            throw ValidationException::withMessages([
                'items' => ['The order total exceeds the supported maximum.'],
            ]);
        }

        return DB::transaction(function () use (
            $payload,
            $user,
            $branch,
            $method,
            $deliveryAddress,
            $deliveryRemarks,
            $calculatedItems,
            $subtotalCents,
        ): OrderRequest {
            $customer = $this->resolveCustomer(
                $payload,
                $user,
                $method,
                $deliveryAddress,
            );
            $subtotal = $this->moneyFromCents($subtotalCents);

            $order = OrderRequest::create([
                'order_reference' => $this->generateReference(),
                'customer_id' => $customer->id,
                'branch_id' => $branch->id,
                'fulfillment_type' => $method,
                'order_status' => 'pending',
                'subtotal' => $subtotal,
                'delivery_fee' => '0.00',
                'total_amount' => $subtotal,
                'customer_notes' => $payload['order_notes'] ?? null,
            ]);

            foreach ($calculatedItems as $calculatedItem) {
                $order->items()->create([
                    'product_id' => $calculatedItem['product']->id,
                    'product_name' => $calculatedItem['product']->name,
                    'unit_price' => $calculatedItem['unit_price'],
                    'quantity' => $calculatedItem['quantity'],
                    'subtotal' => $calculatedItem['subtotal'],
                ]);
            }

            if ($method === 'pickup') {
                PickupRequest::create([
                    'order_id' => $order->id,
                    'branch_id' => $branch->id,
                    'pickup_status' => 'pending',
                ]);
            } else {
                DeliveryRequest::create([
                    'order_id' => $order->id,
                    'branch_id' => $branch->id,
                    'delivery_address' => $deliveryAddress,
                    'delivery_fee' => '0.00',
                    'delivery_status' => 'waiting_for_booking',
                    'remarks' => $deliveryRemarks,
                ]);
            }

            return $order->load([
                'branch',
                'customer',
                'items.product',
                'pickupRequest',
                'deliveryRequest',
            ]);
        });
    }

    private function resolveBranch(int $branchId, string $method): Branch
    {
        $branch = Branch::query()
            ->whereKey($branchId)
            ->where('status', 'active')
            ->first();

        if (! $branch) {
            throw ValidationException::withMessages([
                'fulfillment.branch_id' => ['The selected branch is not active.'],
            ]);
        }

        if (! $branch->pickup_available && $method === 'pickup') {
            throw ValidationException::withMessages([
                'fulfillment.branch_id' => ['The selected branch is not available for pickup.'],
            ]);
        }

        return $branch;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function resolveCustomer(
        array $payload,
        ?User $user,
        string $method,
        ?string $deliveryAddress,
    ): Customer {
        if ($user) {
            $user->loadMissing('customer');

            if ($user->role !== 'customer' || $user->status !== 'active') {
                throw ValidationException::withMessages([
                    'customer' => ['Only active customer accounts may submit orders.'],
                ]);
            }

            if (! $user->customer) {
                throw ValidationException::withMessages([
                    'customer' => ['The authenticated customer profile is missing.'],
                ]);
            }

            return $user->customer;
        }

        $guest = (array) ($payload['customer'] ?? []);
        $requiredFields = [
            'name' => 'customer.name',
            'email' => 'customer.email',
            'contact_number' => 'customer.contact_number',
        ];

        foreach ($requiredFields as $field => $errorKey) {
            if (blank($guest[$field] ?? null)) {
                throw ValidationException::withMessages([
                    $errorKey => ['This field is required for guest checkout.'],
                ]);
            }
        }

        return Customer::create([
            'user_id' => null,
            'full_name' => trim((string) $guest['name']),
            'contact_number' => trim((string) $guest['contact_number']),
            'email' => trim((string) $guest['email']),
            'address' => $guest['address'] ?? ($method === 'delivery' ? $deliveryAddress : null),
        ]);
    }

    /**
     * @param  array<string, mixed>  $delivery
     */
    private function deliveryAddress(array $delivery): string
    {
        $barangay = trim((string) ($delivery['barangay'] ?? ''));

        return implode(', ', array_filter([
            trim((string) ($delivery['address'] ?? '')),
            $barangay !== '' ? 'Barangay '.$barangay : null,
            trim((string) ($delivery['city'] ?? '')),
        ]));
    }

    /**
     * @param  array<string, mixed>  $delivery
     */
    private function deliveryRemarks(array $delivery): string
    {
        $remarks = 'Contact person: '.trim((string) ($delivery['contact_person'] ?? ''));

        if (filled($delivery['notes'] ?? null)) {
            $remarks .= "\nNotes: ".trim((string) $delivery['notes']);
        }

        if (mb_strlen($remarks) > 255) {
            throw ValidationException::withMessages([
                'fulfillment.delivery' => ['The delivery contact and notes exceed the supported length.'],
            ]);
        }

        return $remarks;
    }

    private function generateReference(): string
    {
        for ($attempt = 0; $attempt < 10; $attempt++) {
            $reference = sprintf(
                'ALD-%s-%06d',
                now()->format('Y'),
                random_int(0, 999999),
            );

            if (! OrderRequest::query()->where('order_reference', $reference)->exists()) {
                return $reference;
            }
        }

        throw new RuntimeException('Unable to generate a unique order reference.');
    }

    private function moneyToCents(string $amount): int
    {
        $amount = trim($amount);

        if (! preg_match('/^-?\d+(?:\.\d{1,2})?$/', $amount)) {
            throw new RuntimeException('Invalid product price.');
        }

        $negative = str_starts_with($amount, '-');
        $unsigned = ltrim($amount, '-');
        [$whole, $fraction] = array_pad(explode('.', $unsigned, 2), 2, '0');
        $cents = ((int) $whole * 100) + (int) str_pad($fraction, 2, '0');

        return $negative ? -$cents : $cents;
    }

    private function moneyFromCents(int $cents): string
    {
        $negative = $cents < 0;
        $absolute = abs($cents);
        $value = intdiv($absolute, 100).'.'.str_pad((string) ($absolute % 100), 2, '0', STR_PAD_LEFT);

        return $negative ? '-'.$value : $value;
    }
}
