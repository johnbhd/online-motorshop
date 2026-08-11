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
            'label' => 'Pending Orders',
            'value' => 8,
            'description' => 'Awaiting staff review',
            'icon' => 'fa-solid fa-clock',
            'iconStyle' => 'bg-orange-50 text-orange-600',
        ],
        [
            'label' => 'Confirmed Orders',
            'value' => 12,
            'description' => 'Currently being processed',
            'icon' => 'fa-solid fa-circle-check',
            'iconStyle' => 'bg-blue-50 text-blue-700',
        ],
        [
            'label' => 'Payments to Verify',
            'value' => 3,
            'description' => 'Proof awaiting review',
            'icon' => 'fa-regular fa-credit-card',
            'iconStyle' => 'bg-orange-50 text-orange-600',
        ],
        [
            'label' => 'Pickup Requests',
            'value' => 4,
            'description' => 'Orders requiring pickup action',
            'icon' => 'fa-solid fa-store',
            'iconStyle' => 'bg-orange-50 text-orange-600',
        ],
        [
            'label' => 'Delivery Requests',
            'value' => 2,
            'description' => 'Lalamove actions required',
            'icon' => 'fa-solid fa-motorcycle',
            'iconStyle' => 'bg-orange-50 text-orange-600',
        ],
        [
            'label' => 'Completed Today',
            'value' => 15,
            'description' => 'Orders successfully completed',
            'icon' => 'fa-solid fa-check-double',
            'iconStyle' => 'bg-emerald-50 text-emerald-700',
        ],
    ];

    $recentOrders = [
        [
            'reference' => 'ALD-2026-000128',
            'customer' => 'Mark Reyes',
            'request' => 'Order Review',
            'fulfillment' => 'Store Pickup',
            'status' => 'Pending',
            'statusStyle' => 'bg-orange-50 text-orange-700 ring-orange-200',
            'time' => '10 min ago',
            'action' => 'View Order',
        ],
        [
            'reference' => 'ALD-2026-000127',
            'customer' => 'Angela Cruz',
            'request' => 'Payment Verification',
            'fulfillment' => 'Lalamove Delivery',
            'status' => 'Waiting for Verification',
            'statusStyle' => 'bg-amber-50 text-amber-700 ring-amber-200',
            'time' => '24 min ago',
            'action' => 'Verify Payment',
        ],
        [
            'reference' => 'ALD-2026-000125',
            'customer' => 'Paolo Santos',
            'request' => 'Store Pickup',
            'fulfillment' => null,
            'status' => 'Preparing Order',
            'statusStyle' => 'bg-blue-50 text-blue-700 ring-blue-200',
            'time' => '38 min ago',
            'action' => 'View Pickup',
        ],
        [
            'reference' => 'ALD-2026-000124',
            'customer' => 'Carla Mendoza',
            'request' => 'Lalamove Delivery',
            'fulfillment' => null,
            'status' => 'Waiting for Booking',
            'statusStyle' => 'bg-orange-50 text-orange-700 ring-orange-200',
            'time' => '51 min ago',
            'action' => 'Arrange Delivery',
        ],
        [
            'reference' => 'ALD-2026-000121',
            'customer' => 'Miguel Ramos',
            'request' => 'Product Availability',
            'fulfillment' => null,
            'status' => 'Needs Confirmation',
            'statusStyle' => 'bg-violet-50 text-violet-700 ring-violet-200',
            'time' => '1 hr ago',
            'action' => 'Review',
        ],
    ];
@endphp

@section('content')
    <div class="space-y-6">
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

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                            >
                                {{ $card['value'] }}
                            </span>
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
            aria-labelledby="recent-orders-heading"
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
                <table class="min-w-[960px] w-full border-collapse text-left">
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

                    <tbody class="divide-y divide-slate-100">
                        @foreach ($recentOrders as $order)
                            <tr class="transition hover:bg-slate-50/80">
                                <td
                                    class="whitespace-nowrap px-6 py-4 text-sm font-semibold text-[#0B1930]"
                                >
                                    {{ $order['reference'] }}
                                </td>
                                <td
                                    class="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-700"
                                >
                                    {{ $order['customer'] }}
                                </td>
                                <td class="px-6 py-4 text-sm text-slate-600">
                                    <span class="font-medium text-slate-700">
                                        {{ $order['request'] }}
                                    </span>

                                    @if ($order['fulfillment'])
                                        <span class="text-slate-400">/</span>
                                        <span>{{ $order['fulfillment'] }}</span>
                                    @endif
                                </td>
                                <td class="whitespace-nowrap px-6 py-4">
                                    <span
                                        class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset {{ $order['statusStyle'] }}"
                                    >
                                        {{ $order['status'] }}
                                    </span>
                                </td>
                                <td
                                    class="whitespace-nowrap px-6 py-4 text-sm text-slate-500"
                                >
                                    {{ $order['time'] }}
                                </td>
                                <td class="whitespace-nowrap px-6 py-4">
                                    <a
                                        href="{{ $ordersUrl }}"
                                        class="text-sm font-semibold text-blue-700 transition hover:text-blue-900 focus:outline-none focus-visible:underline"
                                    >
                                        {{ $order['action'] }}
                                    </a>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </section>
    </div>
@endsection
