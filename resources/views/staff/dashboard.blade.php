@extends('layouts.staff')

@section('title', 'Staff Dashboard | ALD Motorshop')
@section('header-title', 'Dashboard')

@php
    $staffName = auth()->user()?->name ?? 'Staff User';
    $currentDate = now()->format('l, F j, Y');
    $ordersUrl = \Illuminate\Support\Facades\Route::has('staff.orders.index')
        ? route('staff.orders.index')
        : '#';

    $summaryCards = [
        [
            'key' => 'pending_orders',
            'label' => 'Pending Orders',
            'description' => 'Awaiting staff review',
            'icon' => 'fa-solid fa-clock',
            'iconStyle' => 'bg-orange-50 text-orange-600',
        ],
        [
            'key' => 'confirmed_orders',
            'label' => 'Confirmed Orders',
            'description' => 'Currently being processed',
            'icon' => 'fa-solid fa-circle-check',
            'iconStyle' => 'bg-blue-50 text-blue-700',
        ],
        [
            'key' => 'payments_to_verify',
            'label' => 'Payments to Verify',
            'description' => 'Proof awaiting review',
            'icon' => 'fa-regular fa-credit-card',
            'iconStyle' => 'bg-orange-50 text-orange-600',
        ],
        [
            'key' => 'pickup_requests',
            'label' => 'Pickup Requests',
            'description' => 'Orders requiring pickup action',
            'icon' => 'fa-solid fa-store',
            'iconStyle' => 'bg-orange-50 text-orange-600',
        ],
        [
            'key' => 'delivery_requests',
            'label' => 'Delivery Requests',
            'description' => 'Lalamove actions required',
            'icon' => 'fa-solid fa-motorcycle',
            'iconStyle' => 'bg-orange-50 text-orange-600',
        ],
        [
            'key' => 'completed_today',
            'label' => 'Completed Today',
            'description' => 'Orders successfully completed',
            'icon' => 'fa-solid fa-check-double',
            'iconStyle' => 'bg-emerald-50 text-emerald-700',
        ],
    ];
@endphp

@section('content')
    <div
        class="space-y-6"
        aria-busy="true"
        data-staff-dashboard
        data-dashboard-endpoint="{{ route('staff.dashboard.data') }}"
    >
        <div
            class="hidden rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
            role="alert"
            data-dashboard-error
        >
            <div
                class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
                <p>Unable to load dashboard data. Please try again.</p>

                <button
                    type="button"
                    class="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    data-dashboard-retry
                >
                    Retry
                </button>
            </div>
        </div>

        <section
            class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
            aria-labelledby="dashboard-greeting"
        >
            <div>
                <h2
                    id="dashboard-greeting"
                    class="text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl"
                >
                    Good evening, {{ $staffName }}
                </h2>

                <p class="mt-2 text-sm text-slate-600 sm:text-base">
                    Here's what needs your attention at ALD Motorshop today.
                </p>
            </div>

            <div
                class="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end"
            >
                <p class="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <i
                        class="fa-regular fa-calendar text-orange-500"
                        aria-hidden="true"
                    ></i>

                    <span>{{ $currentDate }}</span>
                </p>

                <a
                    href="{{ $ordersUrl }}"
                    class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                >
                    <i
                        class="fa-solid fa-list-check"
                        aria-hidden="true"
                    ></i>

                    <span>View All Orders</span>
                </a>
            </div>
        </section>

        <section aria-labelledby="summary-heading">
            <h2
                id="summary-heading"
                class="sr-only"
            >
                Order summary
            </h2>

            <div
                class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                role="status"
                aria-live="polite"
                data-dashboard-summary-loading
            >
                <span class="sr-only">Loading dashboard summary.</span>

                @for ($cardIndex = 0; $cardIndex < 6; $cardIndex++)
                    <x-skeleton type="stat" />
                @endfor
            </div>

            <div
                class="hidden grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                data-dashboard-summary-content
            >
                @foreach ($summaryCards as $card)
                    <article
                        class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                        <div class="flex items-start justify-between gap-4">
                            <span
                                class="inline-flex size-11 shrink-0 items-center justify-center rounded-lg {{ $card['iconStyle'] }}"
                                aria-hidden="true"
                            >
                                <i class="{{ $card['icon'] }} text-lg"></i>
                            </span>

                            <span
                                class="text-3xl font-bold tracking-tight text-[#0B1930]"
                                data-dashboard-value="{{ $card['key'] }}"
                            ></span>
                        </div>

                        <h3 class="mt-5 font-semibold text-[#0B1930]">
                            {{ $card['label'] }}
                        </h3>

                        <p class="mt-1 text-sm text-slate-500">
                            {{ $card['description'] }}
                        </p>
                    </article>
                @endforeach
            </div>
        </section>

        <section
            class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            role="status"
            aria-live="polite"
            data-dashboard-orders-loading
        >
            <span class="sr-only">Loading recent orders.</span>

            <div class="border-b border-slate-200 px-5 py-5 sm:px-6">
                <x-skeleton
                    type="text"
                    :lines="2"
                    class="max-w-md"
                />
            </div>

            <div class="overflow-x-auto">
                <table class="w-full min-w-[960px] border-collapse">
                    <tbody>
                        @for ($rowIndex = 0; $rowIndex < 5; $rowIndex++)
                            <x-skeleton type="table-row" />
                        @endfor
                    </tbody>
                </table>
            </div>
        </section>

        <section
            class="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            aria-labelledby="recent-orders-heading"
            data-dashboard-orders-content
        >
            <div
                class="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
            >
                <div>
                    <h2
                        id="recent-orders-heading"
                        class="text-lg font-semibold text-[#0B1930]"
                    >
                        Recent Orders
                    </h2>

                    <p class="mt-1 text-sm text-slate-500">
                        Latest customer order requests received by ALD Motorshop.
                    </p>
                </div>

                <a
                    href="{{ $ordersUrl }}"
                    class="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-orange-600 transition hover:text-orange-700 focus:outline-none focus-visible:underline"
                >
                    <span>View All Orders</span>

                    <i
                        class="fa-solid fa-arrow-right text-xs"
                        aria-hidden="true"
                    ></i>
                </a>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full min-w-[960px] border-collapse text-left">
                    <thead class="bg-slate-50">
                        <tr class="border-b border-slate-200">
                            <th
                                scope="col"
                                class="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Reference
                            </th>
                            <th
                                scope="col"
                                class="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Customer
                            </th>
                            <th
                                scope="col"
                                class="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Request / Fulfillment
                            </th>
                            <th
                                scope="col"
                                class="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Status
                            </th>
                            <th
                                scope="col"
                                class="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Time
                            </th>
                            <th
                                scope="col"
                                class="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Action
                            </th>
                        </tr>
                    </thead>

                    <tbody
                        class="divide-y divide-slate-100"
                        data-dashboard-orders-body
                    ></tbody>
                </table>
            </div>
        </section>

        <section
            class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
            role="status"
            aria-live="polite"
            data-dashboard-overview-loading
        >
            <span class="sr-only">Loading dashboard operational overview.</span>

            @for ($cardIndex = 0; $cardIndex < 6; $cardIndex++)
                <x-skeleton
                    type="list"
                    :rows="4"
                />
            @endfor
        </section>

        <section
            class="hidden grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3"
            aria-label="Staff dashboard operational overview"
            data-dashboard-overview-content
            data-pickup-requests-url="{{ route('staff.pickup-requests.index') }}"
            data-delivery-requests-url="{{ route('staff.delivery-requests.index') }}"
            data-payments-url="{{ route('staff.payments.index') }}"
            data-products-url="{{ route('staff.products.index') }}"
            data-messages-url="{{ route('staff.messages.index') }}"
        ></section>

        @php
            $pickupRequestsUrl = \Illuminate\Support\Facades\Route::has('staff.pickup-requests.index')
                ? route('staff.pickup-requests.index')
                : '#';
            $deliveryRequestsUrl = \Illuminate\Support\Facades\Route::has('staff.delivery-requests.index')
                ? route('staff.delivery-requests.index')
                : '#';
            $paymentsUrl = \Illuminate\Support\Facades\Route::has('staff.payments.index')
                ? route('staff.payments.index')
                : '#';
            $productsUrl = \Illuminate\Support\Facades\Route::has('staff.products.index')
                ? route('staff.products.index')
                : '#';
            $messagesUrl = \Illuminate\Support\Facades\Route::has('staff.messages.index')
                ? route('staff.messages.index')
                : '#';

            $todayOrderStatuses = [
                [
                    'label' => 'Pending',
                    'count' => 8,
                    'barWidth' => 'w-[53%]',
                    'barColor' => 'bg-orange-500',
                ],
                [
                    'label' => 'Confirmed',
                    'count' => 12,
                    'barWidth' => 'w-4/5',
                    'barColor' => 'bg-[#0B1930]',
                ],
                [
                    'label' => 'Preparing',
                    'count' => 7,
                    'barWidth' => 'w-[47%]',
                    'barColor' => 'bg-blue-500',
                ],
                [
                    'label' => 'Ready for Pickup',
                    'count' => 4,
                    'barWidth' => 'w-1/4',
                    'barColor' => 'bg-emerald-500',
                ],
                [
                    'label' => 'In Delivery',
                    'count' => 2,
                    'barWidth' => 'w-[13%]',
                    'barColor' => 'bg-violet-500',
                ],
                [
                    'label' => 'Completed',
                    'count' => 15,
                    'barWidth' => 'w-full',
                    'barColor' => 'bg-green-600',
                ],
            ];

            $paymentOverview = [
                [
                    'label' => 'Waiting for Verification',
                    'count' => 3,
                    'icon' => 'fa-solid fa-clock',
                    'iconStyle' => 'bg-orange-100 text-orange-600',
                ],
                [
                    'label' => 'Paid Today',
                    'count' => 11,
                    'icon' => 'fa-solid fa-check',
                    'iconStyle' => 'bg-emerald-100 text-emerald-700',
                ],
                [
                    'label' => 'Unpaid Confirmed Orders',
                    'count' => 5,
                    'icon' => 'fa-solid fa-exclamation',
                    'iconStyle' => 'bg-orange-100 text-orange-600',
                ],
            ];

            $productAlerts = [
                [
                    'name' => 'Honda Brake Pad Set',
                    'availability' => 'Low Stock',
                    'badgeStyle' => 'bg-orange-50 text-orange-700 ring-orange-200',
                    'action' => 'Update',
                ],
                [
                    'name' => 'Yamaha Motorcycle Battery',
                    'availability' => 'Low Stock',
                    'badgeStyle' => 'bg-orange-50 text-orange-700 ring-orange-200',
                    'action' => 'Update',
                ],
                [
                    'name' => 'Suzuki Air Filter',
                    'availability' => 'Out of Stock',
                    'badgeStyle' => 'bg-red-50 text-red-700 ring-red-200',
                    'action' => 'Update',
                ],
                [
                    'name' => 'Motorcycle Tire 70/90-17',
                    'availability' => 'Subject to Confirmation',
                    'badgeStyle' => 'bg-blue-50 text-blue-700 ring-blue-200',
                    'action' => 'Review',
                ],
            ];

            $recentInquiries = [
                [
                    'customer' => 'Mark Reyes',
                    'message' => 'Available po ba yung Honda Click brake pad?',
                    'category' => 'Product Availability',
                    'time' => '12 min ago',
                    'status' => 'Unread',
                    'statusStyle' => 'bg-orange-50 text-orange-700 ring-orange-200',
                ],
                [
                    'customer' => 'Angela Cruz',
                    'message' => 'Pwede po ba Lalamove delivery to Makati?',
                    'category' => 'Delivery Inquiry',
                    'time' => '31 min ago',
                    'status' => 'Unread',
                    'statusStyle' => 'bg-orange-50 text-orange-700 ring-orange-200',
                ],
                [
                    'customer' => 'Paolo Santos',
                    'message' => 'Ready na po ba pickup order ko?',
                    'category' => 'Existing Order',
                    'time' => '1 hr ago',
                    'status' => 'Replied',
                    'statusStyle' => 'bg-emerald-50 text-emerald-700 ring-emerald-200',
                ],
            ];

            $recentActivities = [
                [
                    'description' => 'Order ALD-2026-000126 marked Preparing Order',
                    'time' => '15 min ago',
                    'icon' => 'fa-solid fa-box',
                    'iconStyle' => 'bg-orange-50 text-orange-600',
                ],
                [
                    'description' => 'Payment for ALD-2026-000119 verified',
                    'time' => '28 min ago',
                    'icon' => 'fa-solid fa-check',
                    'iconStyle' => 'bg-emerald-50 text-emerald-700',
                ],
                [
                    'description' => 'ALD-2026-000125 marked Ready for Pickup',
                    'time' => '42 min ago',
                    'icon' => 'fa-solid fa-store',
                    'iconStyle' => 'bg-green-50 text-green-700',
                ],
                [
                    'description' => 'Lalamove booking added to ALD-2026-000118',
                    'time' => '1 hr ago',
                    'icon' => 'fa-solid fa-motorcycle',
                    'iconStyle' => 'bg-orange-50 text-orange-600',
                ],
                [
                    'description' => 'Product Yamaha Battery updated to Low Stock',
                    'time' => '2 hr ago',
                    'icon' => 'fa-solid fa-box-open',
                    'iconStyle' => 'bg-blue-50 text-blue-700',
                ],
            ];
        @endphp

        <section
            class="hidden"
            aria-label="Staff dashboard operational overview"
        >
            <article
                class="h-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                aria-labelledby="today-order-status-heading"
            >
                <h2
                    id="today-order-status-heading"
                    class="text-base font-semibold text-[#0B1930]"
                >
                    Today's Order Status
                </h2>

                <div class="mt-5 space-y-4">
                    @foreach ($todayOrderStatuses as $status)
                        <div
                            class="grid grid-cols-[7.25rem_minmax(0,1fr)_1.5rem] items-center gap-3"
                        >
                            <span class="text-xs font-medium text-slate-600">
                                {{ $status['label'] }}
                            </span>

                            <div
                                class="h-2 overflow-hidden rounded-full bg-slate-100"
                                role="progressbar"
                                aria-label="{{ $status['label'] }} orders"
                                aria-valuenow="{{ $status['count'] }}"
                                aria-valuemin="0"
                                aria-valuemax="15"
                            >
                                <div
                                    class="h-full rounded-full {{ $status['barWidth'] }} {{ $status['barColor'] }}"
                                ></div>
                            </div>

                            <span
                                class="text-right text-sm font-bold text-[#0B1930]"
                            >
                                {{ $status['count'] }}
                            </span>
                        </div>
                    @endforeach
                </div>
            </article>

            <article
                class="h-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                aria-labelledby="fulfillment-overview-heading"
            >
                <h2
                    id="fulfillment-overview-heading"
                    class="text-base font-semibold text-[#0B1930]"
                >
                    Fulfillment Overview
                </h2>

                <div
                    class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2"
                >
                    <section
                        class="flex flex-col rounded-lg border border-slate-200 bg-slate-50/60 p-4"
                        aria-labelledby="store-pickup-heading"
                    >
                        <div class="flex items-center gap-2">
                            <span
                                class="inline-flex size-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600"
                                aria-hidden="true"
                            >
                                <i class="fa-solid fa-store text-sm"></i>
                            </span>

                            <h3
                                id="store-pickup-heading"
                                class="text-sm font-semibold text-[#0B1930]"
                            >
                                Store Pickup
                            </h3>
                        </div>

                        <p class="mt-4 text-lg font-bold text-[#0B1930]">
                            4 Active Requests
                        </p>

                        <ul class="mt-3 space-y-1.5 text-xs text-slate-600">
                            <li class="flex items-center justify-between gap-2">
                                <span>Preparing</span>
                                <strong class="text-[#0B1930]">2</strong>
                            </li>
                            <li class="flex items-center justify-between gap-2">
                                <span>Ready for Pickup</span>
                                <strong class="text-[#0B1930]">2</strong>
                            </li>
                        </ul>

                        <a
                            href="{{ $pickupRequestsUrl }}"
                            class="mt-4 inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-xs font-semibold text-[#0B1930] transition hover:border-orange-300 hover:text-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                        >
                            Manage Pickup Requests
                        </a>
                    </section>

                    <section
                        class="flex flex-col rounded-lg border border-slate-200 bg-slate-50/60 p-4"
                        aria-labelledby="delivery-overview-heading"
                    >
                        <div class="flex items-center gap-2">
                            <span
                                class="inline-flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700"
                                aria-hidden="true"
                            >
                                <i class="fa-solid fa-motorcycle text-sm"></i>
                            </span>

                            <h3
                                id="delivery-overview-heading"
                                class="text-sm font-semibold text-[#0B1930]"
                            >
                                Lalamove Delivery
                            </h3>
                        </div>

                        <p class="mt-4 text-lg font-bold text-[#0B1930]">
                            2 Active Requests
                        </p>

                        <ul class="mt-3 space-y-1.5 text-xs text-slate-600">
                            <li class="flex items-center justify-between gap-2">
                                <span>Waiting for Booking</span>
                                <strong class="text-[#0B1930]">1</strong>
                            </li>
                            <li class="flex items-center justify-between gap-2">
                                <span>In Transit</span>
                                <strong class="text-[#0B1930]">1</strong>
                            </li>
                        </ul>

                        <a
                            href="{{ $deliveryRequestsUrl }}"
                            class="mt-4 inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-xs font-semibold text-[#0B1930] transition hover:border-orange-300 hover:text-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                        >
                            Manage Delivery Requests
                        </a>
                    </section>
                </div>
            </article>

            <article
                class="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                aria-labelledby="payment-overview-heading"
            >
                <h2
                    id="payment-overview-heading"
                    class="text-base font-semibold text-[#0B1930]"
                >
                    Payment Overview
                </h2>

                <div class="mt-5 divide-y divide-slate-100">
                    @foreach ($paymentOverview as $payment)
                        <div class="flex items-center gap-3 py-3 first:pt-0">
                            <span
                                class="inline-flex size-8 shrink-0 items-center justify-center rounded-full {{ $payment['iconStyle'] }}"
                                aria-hidden="true"
                            >
                                <i class="{{ $payment['icon'] }} text-xs"></i>
                            </span>

                            <span class="min-w-0 flex-1 text-sm text-slate-600">
                                {{ $payment['label'] }}
                            </span>

                            <strong class="text-xl text-[#0B1930]">
                                {{ $payment['count'] }}
                            </strong>
                        </div>
                    @endforeach
                </div>

                <a
                    href="{{ $paymentsUrl }}"
                    class="mt-auto inline-flex items-center justify-end gap-2 pt-5 text-sm font-semibold text-orange-600 transition hover:text-orange-700 focus:outline-none focus-visible:underline"
                >
                    <span>View Payments</span>
                    <i
                        class="fa-solid fa-arrow-right text-xs"
                        aria-hidden="true"
                    ></i>
                </a>
            </article>

            <article
                class="h-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                aria-labelledby="product-alerts-heading"
            >
                <h2
                    id="product-alerts-heading"
                    class="text-base font-semibold text-[#0B1930]"
                >
                    Product Availability Alerts
                </h2>

                <div class="mt-4 divide-y divide-slate-100">
                    @foreach ($productAlerts as $product)
                        <div
                            class="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                        >
                            <div class="min-w-0 flex-1">
                                <p class="text-sm font-medium text-[#0B1930]">
                                    {{ $product['name'] }}
                                </p>

                                <span
                                    class="mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset {{ $product['badgeStyle'] }}"
                                >
                                    {{ $product['availability'] }}
                                </span>
                            </div>

                            <a
                                href="{{ $productsUrl }}"
                                class="shrink-0 text-xs font-semibold text-blue-700 transition hover:text-blue-900 focus:outline-none focus-visible:underline"
                            >
                                {{ $product['action'] }}
                            </a>
                        </div>
                    @endforeach
                </div>
            </article>

            <article
                class="h-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                aria-labelledby="recent-inquiries-heading"
            >
                <div class="flex items-center justify-between gap-3">
                    <h2
                        id="recent-inquiries-heading"
                        class="text-base font-semibold text-[#0B1930]"
                    >
                        Recent Customer Inquiries
                    </h2>

                    <a
                        href="{{ $messagesUrl }}"
                        class="shrink-0 text-xs font-semibold text-orange-600 transition hover:text-orange-700 focus:outline-none focus-visible:underline"
                    >
                        View All Messages
                    </a>
                </div>

                <div class="mt-4 divide-y divide-slate-100">
                    @foreach ($recentInquiries as $inquiry)
                        <div class="flex gap-3 py-3 first:pt-0 last:pb-0">
                            <span
                                class="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200"
                                aria-hidden="true"
                            >
                                <i class="fa-regular fa-user text-sm"></i>
                            </span>

                            <div class="min-w-0 flex-1">
                                <div
                                    class="flex flex-wrap items-center gap-x-2 gap-y-1"
                                >
                                    <h3
                                        class="text-sm font-semibold text-[#0B1930]"
                                    >
                                        {{ $inquiry['customer'] }}
                                    </h3>

                                    <span
                                        class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset {{ $inquiry['statusStyle'] }}"
                                    >
                                        {{ $inquiry['status'] }}
                                    </span>
                                </div>

                                <p
                                    class="mt-1 truncate text-sm text-slate-600"
                                    title="{{ $inquiry['message'] }}"
                                >
                                    “{{ $inquiry['message'] }}”
                                </p>

                                <div
                                    class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500"
                                >
                                    <span>{{ $inquiry['category'] }}</span>
                                    <span
                                        class="size-1 rounded-full bg-slate-300"
                                        aria-hidden="true"
                                    ></span>
                                    <span>{{ $inquiry['time'] }}</span>
                                </div>
                            </div>
                        </div>
                    @endforeach
                </div>
            </article>

            <article
                class="h-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                aria-labelledby="recent-activity-heading"
            >
                <h2
                    id="recent-activity-heading"
                    class="text-base font-semibold text-[#0B1930]"
                >
                    Recent Activity
                </h2>

                <div class="mt-4 divide-y divide-slate-100">
                    @foreach ($recentActivities as $activity)
                        <div
                            class="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                        >
                            <span
                                class="inline-flex size-8 shrink-0 items-center justify-center rounded-full {{ $activity['iconStyle'] }}"
                                aria-hidden="true"
                            >
                                <i class="{{ $activity['icon'] }} text-xs"></i>
                            </span>

                            <p
                                class="min-w-0 flex-1 text-xs leading-5 text-slate-600"
                            >
                                {{ $activity['description'] }}
                            </p>

                            <time
                                class="shrink-0 whitespace-nowrap text-[11px] text-slate-400"
                            >
                                {{ $activity['time'] }}
                            </time>
                        </div>
                    @endforeach
                </div>
            </article>
        </section>
    </div>
@endsection
