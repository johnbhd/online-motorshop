<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Conversation;
use App\Models\Customer;
use App\Models\DeliveryRequest;
use App\Models\Message;
use App\Models\OrderItem;
use App\Models\OrderRequest;
use App\Models\Payment;
use App\Models\PickupRequest;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use App\Notifications\StaffAdminNotification;
use App\Services\CustomerNotificationService;
use App\Services\StaffAdminNotificationService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class DemoDatasetSeeder extends Seeder
{
    private const ORDER_COUNT = 50;

    private const REVIEW_COUNT = 25;

    private const ORDER_REFERENCE_START = 900001;

    public function run(): void
    {
        $password = trim((string) env('DEMO_DATASET_PASSWORD', ''));

        if ($password === '') {
            throw new RuntimeException(
                'Set DEMO_DATASET_PASSWORD before running DemoDatasetSeeder. No demo credential is stored in the seeder.',
            );
        }

        $result = DB::transaction(function () use ($password): array {
            $branches = $this->resolveBranches();
            $staff = $this->resolveStaff($branches, $password);
            $admin = $this->resolveAdmin($password);
            $customers = $this->resolveCustomers($password);
            $products = $this->resolveProducts();
            $orders = $this->seedOrders($branches, $staff, $customers, $products);
            $reviews = $this->seedReviews($orders, $staff, $admin);

            $this->seedConversations($customers, $staff);
            $this->seedDomainNotifications($orders, $reviews, $staff, $admin);

            return [
                'staff' => $staff->count(),
                'customers' => $customers->count(),
                'orders' => count($orders),
                'reviews' => $reviews->count(),
            ];
        });

        $this->command?->info(sprintf(
            'Demo dataset ready: %d Staff, %d Customers, %d Orders, %d Reviews.',
            $result['staff'],
            $result['customers'],
            $result['orders'],
            $result['reviews'],
        ));
    }

    private function resolveBranches(): Collection
    {
        $names = ['Imus Branch', 'Makati Branch', 'Manila Branch'];
        $branches = Branch::query()
            ->whereIn('name', $names)
            ->where('status', 'active')
            ->get()
            ->keyBy('name');

        foreach ($names as $name) {
            $branch = $branches->get($name);

            if (! $branch || ! $branch->pickup_available) {
                throw new RuntimeException("Active pickup branch is missing or unavailable: {$name}");
            }
        }

        return $branches;
    }

    private function resolveStaff(Collection $branches, string $password): Collection
    {
        $definitions = [
            'Imus Branch' => ['name' => 'Imy', 'email' => 'staff-cavite@gmail.com'],
            'Makati Branch' => ['name' => 'Mike', 'email' => 'staff-makati@gmail.com'],
            'Manila Branch' => ['name' => 'Miles', 'email' => 'staff-manila@gmail.com'],
        ];

        $staff = collect();

        foreach ($definitions as $branchName => $definition) {
            $user = User::query()->firstOrCreate(
                ['email' => $definition['email']],
                [
                    'name' => $definition['name'],
                    'password' => $password,
                    'branch_id' => $branches->get($branchName)->id,
                    'status' => 'active',
                    'role' => 'staff',
                ],
            );

            $user->forceFill([
                'name' => $definition['name'],
                'branch_id' => $branches->get($branchName)->id,
                'status' => 'active',
                'role' => 'staff',
            ])->saveQuietly();

            $staff->put($branchName, $user->fresh());
        }

        return $staff;
    }

    private function resolveAdmin(string $password): User
    {
        $admin = User::query()->firstOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name' => 'System Admin',
                'password' => $password,
                'branch_id' => null,
                'status' => 'active',
                'role' => 'admin',
            ],
        );

        $admin->forceFill([
            'name' => 'System Admin',
            'branch_id' => null,
            'status' => 'active',
            'role' => 'admin',
        ])->saveQuietly();

        return $admin->fresh();
    }

    private function resolveCustomers(string $password): Collection
    {
        $names = [
            'Alex Santos', 'Bea Cruz', 'Carlo Reyes', 'Dani Flores',
            'Ella Mendoza', 'Felix Navarro', 'Gina Ramos', 'Hugo Bautista',
            'Iris Garcia', 'Jared Aquino', 'Kara Castillo', 'Luis Dela Cruz',
            'Mia Fernandez', 'Nico Gonzales', 'Olive Herrera', 'Paolo Jimenez',
            'Quinn Lim', 'Rina Mercado', 'Sam Navarro', 'Tina Ong',
            'Ulysses Perez', 'Vera Ramos', 'Wes Santiago', 'Yna Torres',
        ];
        $customers = collect();

        foreach ($names as $index => $name) {
            $number = $index + 1;
            $email = sprintf('demo.customer.%02d@ald-motorshop.test', $number);
            $user = User::query()->firstOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'password' => $password,
                    'branch_id' => null,
                    'status' => 'active',
                    'role' => 'customer',
                ],
            );

            $user->forceFill([
                'name' => $name,
                'branch_id' => null,
                'status' => 'active',
                'role' => 'customer',
            ])->saveQuietly();

            $customers->push(Customer::query()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'full_name' => $name,
                    'contact_number' => '0917'.str_pad((string) (7000000 + $number), 7, '0', STR_PAD_LEFT),
                    'email' => $email,
                    'address' => 'Demo address '.str_pad((string) $number, 2, '0', STR_PAD_LEFT).', Manila, Philippines',
                ],
            ));
        }

        $guestNames = ['Guest A', 'Guest B', 'Guest C', 'Guest D', 'Guest E', 'Guest F'];

        foreach ($guestNames as $index => $name) {
            $number = $index + 1;
            $email = sprintf('demo.guest.%02d@ald-motorshop.test', $number);
            $customers->push(Customer::query()->updateOrCreate(
                ['email' => $email],
                [
                    'user_id' => null,
                    'full_name' => $name,
                    'contact_number' => '0918'.str_pad((string) (8000000 + $number), 7, '0', STR_PAD_LEFT),
                    'address' => 'Demo guest address '.str_pad((string) $number, 2, '0', STR_PAD_LEFT).', Manila, Philippines',
                ],
            ));
        }

        return $customers->values();
    }

    private function resolveProducts(): Collection
    {
        $products = Product::query()
            ->whereIn('part_number', $this->partNumbers())
            ->where('status', 'active')
            ->where('availability_status', 'active')
            ->get()
            ->keyBy('part_number');

        if ($products->count() !== 39) {
            throw new RuntimeException(
                'DemoDatasetSeeder requires all 39 active Products from ProductSeeder to exist first.',
            );
        }

        return $products->sortBy('part_number')->values();
    }

    /**
     * @return array<int, array{order: OrderRequest, items: Collection, payment: Payment, branch: Branch, staff: User, customer: Customer}>
     */
    private function seedOrders(
        Collection $branches,
        Collection $staff,
        Collection $customers,
        Collection $products,
    ): array {
        $orders = [];

        for ($number = 1; $number <= self::ORDER_COUNT; $number++) {
            $definition = $this->orderDefinition($number);
            $branchName = ['Imus Branch', 'Makati Branch', 'Manila Branch'][($number - 1) % 3];
            $branch = $branches->get($branchName);
            $branchStaff = $staff->get($branchName);
            $customer = $customers->get(($number - 1) % $customers->count());
            $createdAt = $this->timestamp($number);
            $itemSpecs = $this->itemSpecs($number, $products);
            $subtotalCents = collect($itemSpecs)->sum(
                fn (array $item): int => $this->moneyToCents((string) $item['product']->price) * $item['quantity'],
            );
            $deliveryFeeCents = $definition['fulfillment'] === 'delivery' ? 15000 : 0;
            $totalCents = $subtotalCents + $deliveryFeeCents;
            $reference = sprintf('ALD-2026-%06d', self::ORDER_REFERENCE_START + $number - 1);

            $order = OrderRequest::query()->updateOrCreate(
                ['order_reference' => $reference],
                [
                    'customer_id' => $customer->id,
                    'branch_id' => $branch->id,
                    'assigned_staff_id' => $branchStaff->id,
                    'fulfillment_type' => $definition['fulfillment'],
                    'order_status' => $definition['order_status'],
                    'subtotal' => $this->moneyFromCents($subtotalCents),
                    'delivery_fee' => $this->moneyFromCents($deliveryFeeCents),
                    'total_amount' => $this->moneyFromCents($totalCents),
                    'customer_notes' => "Demo dataset order {$number}.",
                    'staff_notes' => $definition['order_status'] === 'completed'
                        ? 'Completed demo purchase.'
                        : 'Demo order requiring operational attention.',
                ],
            );
            $order->forceFill([
                'created_at' => $createdAt,
                'updated_at' => $createdAt->addHours($definition['order_status'] === 'completed' ? 6 : 2),
            ])->saveQuietly();

            foreach ($itemSpecs as $item) {
                /** @var Product $product */
                $product = $item['product'];
                $lineCents = $this->moneyToCents((string) $product->price) * $item['quantity'];
                $orderItem = OrderItem::query()->updateOrCreate(
                    ['order_id' => $order->id, 'product_id' => $product->id],
                    [
                        'product_name' => $product->name,
                        'unit_price' => $product->price,
                        'quantity' => $item['quantity'],
                        'subtotal' => $this->moneyFromCents($lineCents),
                    ],
                );
                $orderItem->forceFill([
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ])->saveQuietly();
            }

            $paymentStatus = $this->paymentStatus($number);
            $payment = Payment::query()->updateOrCreate(
                ['order_id' => $order->id],
                [
                    'payment_method' => $this->paymentMethod($number, $definition['fulfillment']),
                    'amount' => $this->moneyFromCents($totalCents),
                    'payment_reference' => sprintf('DEMO-PAY-%03d', $number),
                    'proof_image_url' => null,
                    'proof_image_public_id' => null,
                    'payment_status' => $paymentStatus,
                    'verified_by' => in_array($paymentStatus, [Payment::STATUS_PAID, Payment::STATUS_FAILED], true)
                        ? $branchStaff->id
                        : null,
                    'verified_at' => in_array($paymentStatus, [Payment::STATUS_PAID, Payment::STATUS_FAILED], true)
                        ? $createdAt->addHour()
                        : null,
                ],
            );
            $payment->forceFill([
                'created_at' => $createdAt,
                'updated_at' => $createdAt->addHour(),
            ])->saveQuietly();

            if ($definition['fulfillment'] === 'pickup') {
                $pickup = PickupRequest::query()->updateOrCreate(
                    ['order_id' => $order->id],
                    [
                        'branch_id' => $branch->id,
                        'assigned_staff_id' => $branchStaff->id,
                        'pickup_date' => $createdAt->toDateString(),
                        'pickup_time' => $createdAt->addHours(5)->format('H:i:s'),
                        'pickup_status' => $definition['fulfillment_status'],
                        'remarks' => "Demo pickup request {$number}.",
                        'completed_at' => $definition['fulfillment_status'] === 'completed'
                            ? $createdAt->addHours(5)
                            : null,
                    ],
                );
                $pickup->forceFill([
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt->addHours(5),
                ])->saveQuietly();
            } else {
                $delivery = DeliveryRequest::query()->updateOrCreate(
                    ['order_id' => $order->id],
                    [
                        'branch_id' => $branch->id,
                        'assigned_staff_id' => $branchStaff->id,
                        'delivery_address' => "Demo delivery address {$number}, Manila, Philippines",
                        'delivery_fee' => $this->moneyFromCents($deliveryFeeCents),
                        'booking_reference' => in_array($definition['fulfillment_status'], ['booked', 'picked_up', 'in_transit', 'delivered'], true)
                            ? sprintf('LALA-DEMO-%03d', $number)
                            : null,
                        'tracking_url' => in_array($definition['fulfillment_status'], ['picked_up', 'in_transit', 'delivered'], true)
                            ? "https://tracking.example.test/demo/{$number}"
                            : null,
                        'rider_name' => in_array($definition['fulfillment_status'], ['picked_up', 'in_transit', 'delivered'], true)
                            ? "Demo Rider {$number}"
                            : null,
                        'rider_contact' => in_array($definition['fulfillment_status'], ['picked_up', 'in_transit', 'delivered'], true)
                            ? '0919'.str_pad((string) (6000000 + $number), 7, '0', STR_PAD_LEFT)
                            : null,
                        'delivery_status' => $definition['fulfillment_status'],
                        'remarks' => "Contact person: Demo Customer {$number}",
                        'delivered_at' => $definition['fulfillment_status'] === 'delivered'
                            ? $createdAt->addHours(6)
                            : null,
                    ],
                );
                $delivery->forceFill([
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt->addHours(6),
                ])->saveQuietly();
            }

            $orders[$number] = [
                'order' => $order->fresh(),
                'items' => $order->items()->get(),
                'payment' => $payment->fresh(),
                'branch' => $branch,
                'staff' => $branchStaff,
                'customer' => $customer,
            ];
        }

        return $orders;
    }

    /**
     * @param  array<int, array{order: OrderRequest, items: Collection, payment: Payment, branch: Branch, staff: User, customer: Customer}>  $orders
     */
    private function seedReviews(array $orders, Collection $staff, User $admin): Collection
    {
        $ratings = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 4, 3, 3, 3, 3, 2, 2, 2, 1];
        $statuses = array_merge(
            array_fill(0, 19, Review::STATUS_PUBLISHED),
            array_fill(0, 3, Review::STATUS_PENDING),
            array_fill(0, 2, Review::STATUS_FLAGGED),
            [Review::STATUS_HIDDEN],
        );
        $reviewOrderNumbers = array_merge(range(1, 24), [31]);
        $texts = [
            'The part fit my motorcycle correctly and arrived in good condition.',
            'Smooth pickup and the staff confirmed the item quickly.',
            'Good quality for the price and easy to install.',
            'The product matched the listing and was packed well.',
            'Fast service at the branch. I will order again.',
            'The part feels durable and works as expected.',
            'Correct compatibility and helpful staff assistance.',
            'The order was ready earlier than I expected.',
            'Good motorcycle part with clear product information.',
            'Everything was complete when I collected the order.',
            'The item is useful, but the packaging could be stronger.',
            'Pickup was organized and the price was fair.',
            'The part works well after installation.',
            'The product quality was better than I expected.',
            'Friendly service and an accurate order.',
            'The item was correct, although preparation took longer than expected.',
            'Good fit and reasonable price for a genuine replacement.',
            'The product is fine and the branch team was responsive.',
            'Well packed and delivered in good condition.',
            'The delivery was smooth and the part matched the order.',
            'The product works, but communication about the delay could improve.',
            'The delivery took longer than expected, though the item was correct.',
            'The quality was acceptable but not as strong as I hoped.',
            'The item arrived late and the packaging had visible wear.',
            'The product did not meet my expectations for the price.',
        ];
        $reviews = collect();

        foreach ($reviewOrderNumbers as $index => $orderNumber) {
            $orderData = $orders[$orderNumber];
            $order = $orderData['order'];
            $item = $orderData['items']->first();
            $customer = $orderData['customer'];
            $status = $statuses[$index];
            $createdAt = CarbonImmutable::parse($order->created_at)->addHours(8);
            $response = $index < 10
                ? [
                    'text' => $index % 2 === 0
                        ? "Thank you for your feedback! We're glad you had a smooth pickup experience."
                        : "Thank you for letting us know. We'll keep improving our preparation and delivery service.",
                    'user_id' => $orderData['staff']->id,
                    'at' => $createdAt->addHour(),
                ]
                : null;

            $review = Review::query()->updateOrCreate(
                [
                    'customer_id' => $customer->id,
                    'product_id' => $item->product_id,
                ],
                [
                    'order_id' => $order->id,
                    'order_item_id' => $item->id,
                    'rating' => $ratings[$index],
                    'review_text' => $texts[$index],
                    'status' => $status,
                    'verified_purchase' => true,
                    'flag_reason' => in_array($status, [Review::STATUS_FLAGGED, Review::STATUS_HIDDEN], true)
                        ? 'Demo moderation case for Admin review.'
                        : null,
                    'flagged_by' => $status === Review::STATUS_FLAGGED ? $orderData['staff']->id : null,
                    'flagged_at' => $status === Review::STATUS_FLAGGED ? $createdAt->addHour() : null,
                    'response_text' => $response['text'] ?? null,
                    'response_user_id' => $response['user_id'] ?? null,
                    'response_at' => $response['at'] ?? null,
                    'moderated_by' => in_array($status, [Review::STATUS_PUBLISHED, Review::STATUS_HIDDEN], true)
                        ? $admin->id
                        : null,
                    'moderated_at' => in_array($status, [Review::STATUS_PUBLISHED, Review::STATUS_HIDDEN], true)
                        ? $createdAt->addHours(2)
                        : null,
                    'published_at' => $status === Review::STATUS_PUBLISHED ? $createdAt->addHours(2) : null,
                    'hidden_at' => $status === Review::STATUS_HIDDEN ? $createdAt->addHours(2) : null,
                ],
            );
            $review->forceFill([
                'created_at' => $createdAt,
                'updated_at' => $createdAt->addHours(2),
            ])->saveQuietly();
            $reviews->push($review->fresh(['order', 'product']));
        }

        return $reviews;
    }

    private function seedConversations(Collection $customers, Collection $staff): void
    {
        $customerUsers = $customers
            ->filter(fn (Customer $customer): bool => $customer->user_id !== null)
            ->values();
        $customerNotificationService = app(CustomerNotificationService::class);
        $staffAdminNotificationService = app(StaffAdminNotificationService::class);

        for ($index = 1; $index <= 5; $index++) {
            $customer = $customerUsers->get($index - 1);
            $staffUser = $staff->values()->get(($index - 1) % $staff->count());
            $baseTime = CarbonImmutable::create(2026, 10, 5 + $index - 1, 9, 15, 0, 'UTC');
            $conversation = Conversation::query()->updateOrCreate(
                ['customer_id' => $customer->id],
                [
                    'participant_type' => 'customer',
                    'status' => 'open',
                ],
            );

            $message = Message::query()->firstOrCreate(
                [
                    'conversation_id' => $conversation->id,
                    'sender_type' => 'customer',
                    'body' => "Demo customer message {$index}: Can you confirm the fitment for my part?",
                ],
                ['sender_user_id' => $customer->user_id],
            );
            $message->forceFill([
                'created_at' => $baseTime,
                'updated_at' => $baseTime,
            ])->saveQuietly();
            $conversation->forceFill(['last_message_at' => $baseTime])->saveQuietly();
            $staffAdminNotificationService->customerMessageReceived($message->fresh());

            $replyTime = $baseTime->addHours(2);
            $reply = Message::query()->firstOrCreate(
                [
                    'conversation_id' => $conversation->id,
                    'sender_type' => 'staff',
                    'body' => "ALD Staff reply {$index}: We checked the catalog and can help with that order.",
                ],
                ['sender_user_id' => $staffUser->id],
            );
            $reply->forceFill([
                'created_at' => $replyTime,
                'updated_at' => $replyTime,
            ])->saveQuietly();
            $conversation->forceFill(['last_message_at' => $replyTime])->saveQuietly();
            $customerNotificationService->supportMessageReceived($reply->fresh());
        }
    }

    /**
     * @param  array<int, array{order: OrderRequest, items: Collection, payment: Payment, branch: Branch, staff: User, customer: Customer}>  $orders
     */
    private function seedDomainNotifications(array $orders, Collection $reviews, Collection $staff, User $admin): void
    {
        $customerNotificationService = app(CustomerNotificationService::class);
        $staffAdminNotificationService = app(StaffAdminNotificationService::class);

        foreach ($orders as $number => $data) {
            $order = $data['order'];
            $payment = $data['payment'];

            if ($number <= 12) {
                $staffAdminNotificationService->orderCreated($order);
            }

            if ($number % 5 === 0) {
                $staffAdminNotificationService->orderAssigned($order, $data['staff']->id);
            }

            if ($order->order_status === 'confirmed') {
                $customerNotificationService->orderStatusChanged($order, 'confirmed');
            } elseif (in_array($order->order_status, ['rejected', 'cancelled'], true)) {
                $customerNotificationService->orderStatusChanged($order, $order->order_status);
            }

            if ($payment->payment_status === Payment::STATUS_PAID
                && $payment->payment_method === Payment::METHOD_ONLINE_PAYMENT) {
                $customerNotificationService->paymentStatusChanged($payment, Payment::STATUS_PAID);
            }

            if ($order->fulfillment_type === 'pickup') {
                $pickup = $order->pickupRequest()->first();

                if ($pickup && in_array($pickup->pickup_status, ['preparing', 'ready_for_pickup', 'completed'], true)) {
                    $customerNotificationService->pickupStatusChanged($pickup, $pickup->pickup_status);
                }
            } else {
                $delivery = $order->deliveryRequest()->first();

                if ($delivery && in_array($delivery->delivery_status, ['booked', 'picked_up', 'in_transit', 'delivered', 'cancelled'], true)) {
                    $customerNotificationService->deliveryStatusChanged($delivery, $delivery->delivery_status);
                }
            }
        }

        $reviews->filter(fn (Review $review): bool => in_array(
            $review->status,
            [Review::STATUS_FLAGGED, Review::STATUS_HIDDEN],
            true,
        ))->each(function (Review $review) use ($staff, $admin): void {
            $review->loadMissing('order.branch', 'product');
            $branchStaff = $staff->get($review->order?->branch?->name);
            $data = [
                'notification_type' => 'review_attention_required',
                'category' => 'attention',
                'title' => 'Review Needs Admin Attention',
                'message' => "Review for {$review->product?->name} requires moderation.",
                'reference' => [
                    'type' => 'review',
                    'review_id' => $review->id,
                    'order_id' => $review->order_id,
                    'order_reference' => $review->order?->order_reference,
                    'branch_id' => $review->order?->branch_id,
                ],
                'event_key' => "demo:review:attention:{$review->id}",
            ];

            if ($branchStaff instanceof User) {
                $this->notifyOnce($branchStaff, $data);
            }
            $this->notifyOnce($admin, $data);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function notifyOnce(User $user, array $data): void
    {
        $eventKey = (string) $data['event_key'];
        $exists = $user->notifications()
            ->where('type', StaffAdminNotification::class)
            ->where('data', 'like', '%"event_key":"'.addslashes($eventKey).'"%')
            ->exists();

        if (! $exists) {
            $user->notify(new StaffAdminNotification($data));
        }
    }

    /**
     * @return array{fulfillment: string, order_status: string, fulfillment_status: string}
     */
    private function orderDefinition(int $number): array
    {
        if ($number <= 24) {
            return ['fulfillment' => 'pickup', 'order_status' => 'completed', 'fulfillment_status' => 'completed'];
        }
        if ($number === 25) {
            return ['fulfillment' => 'pickup', 'order_status' => 'confirmed', 'fulfillment_status' => 'preparing'];
        }
        if ($number === 26) {
            return ['fulfillment' => 'pickup', 'order_status' => 'confirmed', 'fulfillment_status' => 'ready_for_pickup'];
        }
        if ($number === 27) {
            return ['fulfillment' => 'pickup', 'order_status' => 'under_review', 'fulfillment_status' => 'pending'];
        }
        if ($number === 28) {
            return ['fulfillment' => 'pickup', 'order_status' => 'pending', 'fulfillment_status' => 'pending'];
        }
        if ($number <= 42) {
            return ['fulfillment' => 'delivery', 'order_status' => 'completed', 'fulfillment_status' => 'delivered'];
        }
        if ($number === 43) {
            return ['fulfillment' => 'delivery', 'order_status' => 'confirmed', 'fulfillment_status' => 'booked'];
        }
        if ($number === 44) {
            return ['fulfillment' => 'delivery', 'order_status' => 'confirmed', 'fulfillment_status' => 'picked_up'];
        }
        if ($number === 45) {
            return ['fulfillment' => 'delivery', 'order_status' => 'confirmed', 'fulfillment_status' => 'in_transit'];
        }
        if ($number <= 47) {
            return ['fulfillment' => 'delivery', 'order_status' => 'under_review', 'fulfillment_status' => 'waiting_for_booking'];
        }
        if ($number === 48) {
            return ['fulfillment' => 'delivery', 'order_status' => 'pending', 'fulfillment_status' => 'waiting_for_booking'];
        }
        if ($number === 49) {
            return ['fulfillment' => 'delivery', 'order_status' => 'rejected', 'fulfillment_status' => 'cancelled'];
        }

        return ['fulfillment' => 'delivery', 'order_status' => 'cancelled', 'fulfillment_status' => 'cancelled'];
    }

    private function paymentMethod(int $number, string $fulfillment): string
    {
        if ($fulfillment === 'delivery') {
            return Payment::METHOD_ONLINE_PAYMENT;
        }

        return $number <= 24 && $number % 2 === 0
            ? Payment::METHOD_PAY_AT_PICKUP
            : Payment::METHOD_ONLINE_PAYMENT;
    }

    private function paymentStatus(int $number): string
    {
        if ($number <= 24 || $number >= 43 && $number <= 45) {
            return Payment::STATUS_PAID;
        }
        if ($number === 26 || $number === 46) {
            return Payment::STATUS_WAITING_FOR_VERIFICATION;
        }
        if ($number === 48 || $number === 49) {
            return Payment::STATUS_FAILED;
        }
        if ($number === 50) {
            return 'cancelled';
        }

        return Payment::STATUS_UNPAID;
    }

    /**
     * @return array<int, array{product: Product, quantity: int}>
     */
    private function itemSpecs(int $number, Collection $products): array
    {
        $primaryIndex = ($number - 1) % $products->count();
        $items = [[
            'product' => $products->get($primaryIndex),
            'quantity' => 1 + ($number % 3),
        ]];

        if ($number % 3 === 0) {
            $items[] = [
                'product' => $products->get(($primaryIndex + 7) % $products->count()),
                'quantity' => 1 + ($number % 2),
            ];
        }

        return $items;
    }

    private function timestamp(int $number): CarbonImmutable
    {
        return CarbonImmutable::create(
            2026,
            10,
            5 + intdiv($number - 1, 10),
            8 + (($number - 1) % 10),
            ($number * 7) % 60,
            0,
            'UTC',
        );
    }

    /**
     * @return array<int, string>
     */
    private function partNumbers(): array
    {
        return array_merge(
            array_map(fn (int $number): string => sprintf('HON-%03d', $number), range(1, 12)),
            array_map(fn (int $number): string => sprintf('SUZ-%03d', $number), range(1, 10)),
            array_map(fn (int $number): string => sprintf('YAM-%03d', $number), range(1, 17)),
        );
    }

    private function moneyToCents(string $amount): int
    {
        $normalized = number_format((float) $amount, 2, '.', '');
        [$whole, $fraction] = array_pad(explode('.', $normalized, 2), 2, '00');

        return ((int) $whole * 100) + (int) $fraction;
    }

    private function moneyFromCents(int $cents): string
    {
        return number_format($cents / 100, 2, '.', '');
    }
}
