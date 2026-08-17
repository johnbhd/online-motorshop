@extends('layouts.staff')

@section('title', 'Staff Orders | ALD Motorshop')
@section('header-title', 'Orders')

@php
    $statusTabs = [
        [
            'key' => 'all',
            'label' => 'All Orders',
            'countKey' => 'total',
            'count' => 48,
        ],
        [
            'key' => 'pending',
            'label' => 'Pending',
            'countKey' => 'pending',
            'count' => 8,
        ],
        [
            'key' => 'confirmed',
            'label' => 'Confirmed',
            'countKey' => 'confirmed',
            'count' => 12,
        ],
        [
            'key' => 'preparing',
            'label' => 'Preparing',
            'countKey' => 'preparing',
            'count' => 7,
        ],
        [
            'key' => 'ready_for_pickup',
            'label' => 'Ready for Pickup',
            'countKey' => 'ready_for_pickup',
            'count' => 4,
        ],
        [
            'key' => 'delivery',
            'label' => 'Delivery',
            'countKey' => 'delivery',
            'count' => 2,
        ],
        [
            'key' => 'completed',
            'label' => 'Completed',
        ],
        [
            'key' => 'cancelled',
            'label' => 'Cancelled',
        ],
    ];
@endphp

@section('content')
    <div
        class="space-y-5"
        data-staff-orders
        data-orders-endpoint="{{ route('staff.orders.data') }}"
    >
        <section
            class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"
            aria-labelledby="orders-page-heading"
        >
            <div>
                <p
                    class="text-xs font-bold uppercase tracking-[0.18em] text-orange-600"
                >
                    Order Management
                </p>

                <h2
                    id="orders-page-heading"
                    class="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl"
                >
                    Customer Orders
                </h2>

                <p class="mt-2 text-sm text-slate-600 sm:text-base">
                    Review and process customer order requests from one place.
                </p>
            </div>

            <div
                class="inline-flex min-h-11 w-fit items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-800"
            >
                <span
                    class="inline-flex size-8 items-center justify-center rounded-lg bg-white text-orange-600 shadow-sm"
                    aria-hidden="true"
                >
                    <i class="fa-solid fa-clipboard-check"></i>
                </span>

                <span>
                    <strong data-orders-attention-count>8</strong>
                    orders need attention
                </span>
            </div>
        </section>

        <section
            class="rounded-xl border border-slate-200 bg-white px-4 shadow-sm sm:px-5"
            aria-label="Order status navigation"
        >
            <div class="overflow-x-auto">
                <div
                    class="flex min-w-max items-center gap-6"
                    role="tablist"
                    aria-label="Filter orders by status"
                >
                    @foreach ($statusTabs as $tab)
                        <button
                            type="button"
                            @class([
                                'group relative inline-flex min-h-14 cursor-pointer items-center gap-2 border-b-2 px-0.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
                                'border-orange-500 text-[#0B1930]' => $tab['key'] === 'all',
                                'border-transparent text-slate-500 hover:text-[#0B1930]' => $tab['key'] !== 'all',
                            ])
                            role="tab"
                            aria-selected="{{ $tab['key'] === 'all' ? 'true' : 'false' }}"
                            data-orders-tab="{{ $tab['key'] }}"
                        >
                            <span>{{ $tab['label'] }}</span>

                            @isset($tab['count'])
                                <span
                                    class="inline-flex min-w-6 items-center justify-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-600"
                                    data-orders-summary="{{ $tab['countKey'] }}"
                                >
                                    {{ $tab['count'] }}
                                </span>
                            @endisset
                        </button>
                    @endforeach
                </div>
            </div>
        </section>

        <section
            class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            aria-label="Order filters"
        >
            <div
                class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(20rem,1fr)_12rem_10rem_11rem_auto]"
            >
                <label class="relative block">
                    <span class="sr-only">Search orders</span>
                    <i
                        class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400"
                        aria-hidden="true"
                    ></i>
                    <input
                        type="search"
                        class="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-[#0B1930] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        placeholder="Search order reference or customer name"
                        data-orders-search
                    >
                </label>

                <label class="relative block">
                    <span class="sr-only">Filter by fulfillment</span>
                    <select
                        class="min-h-11 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        data-orders-fulfillment
                    >
                        <option value="all">All Fulfillment</option>
                        <option value="Store Pickup">Store Pickup</option>
                        <option value="Lalamove Delivery">Lalamove Delivery</option>
                    </select>
                    <i
                        class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                        aria-hidden="true"
                    ></i>
                </label>

                <label class="relative block">
                    <span class="sr-only">Filter by date</span>
                    <select
                        class="min-h-11 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        data-orders-date
                    >
                        <option value="all">All Dates</option>
                        <option value="2026-08-07">Aug 7, 2026</option>
                        <option value="2026-08-06">Aug 6, 2026</option>
                    </select>
                    <i
                        class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                        aria-hidden="true"
                    ></i>
                </label>

                <label class="relative block">
                    <span class="sr-only">Filter by status</span>
                    <select
                        class="min-h-11 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        data-orders-status
                    >
                        <option value="all">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Payment Verification">Payment Verification</option>
                        <option value="Preparing Order">Preparing Order</option>
                        <option value="Ready for Pickup">Ready for Pickup</option>
                        <option value="Waiting for Booking">Waiting for Booking</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                    <i
                        class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                        aria-hidden="true"
                    ></i>
                </label>

                <button
                    type="button"
                    class="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                    data-orders-clear
                >
                    <i
                        class="fa-solid fa-rotate-left text-xs"
                        aria-hidden="true"
                    ></i>
                    <span>Clear</span>
                </button>
            </div>
        </section>

        <section
            class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            aria-labelledby="all-orders-heading"
            aria-busy="true"
            data-orders-panel
        >
            <div
                class="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
            >
                <div>
                    <h2
                        id="all-orders-heading"
                        class="text-lg font-semibold text-[#0B1930]"
                    >
                        All Orders
                    </h2>
                    <p class="mt-1 text-sm text-slate-500">
                        <span data-orders-total-label>48</span>
                        customer orders
                    </p>
                </div>

                <label class="relative block w-full sm:w-44">
                    <span class="sr-only">Sort orders</span>
                    <select
                        class="min-h-10 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        data-orders-sort
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                    </select>
                    <i
                        class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                        aria-hidden="true"
                    ></i>
                </label>
            </div>

            <div
                role="status"
                aria-live="polite"
                data-orders-loading
            >
                <span class="sr-only">Loading customer orders.</span>

                <div class="overflow-x-auto">
                    <table class="w-full min-w-[1180px] border-collapse text-left">
                        <thead class="bg-slate-50">
                            @include('staff.orders.partials.table-head')
                        </thead>
                        <tbody>
                            @for ($rowIndex = 0; $rowIndex < 8; $rowIndex++)
                                <x-skeleton
                                    type="table-row"
                                    :columns="9"
                                />
                            @endfor
                        </tbody>
                    </table>
                </div>
            </div>

            <div
                class="hidden"
                data-orders-content
            >
                <div class="overflow-x-auto">
                    <table class="w-full min-w-[1180px] border-collapse text-left">
                        <thead class="bg-slate-50">
                            @include('staff.orders.partials.table-head')
                        </thead>
                        <tbody
                            class="divide-y divide-slate-100"
                            data-orders-body
                        ></tbody>
                    </table>
                </div>

                <div
                    class="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                    <p class="text-sm text-slate-500">
                        Showing
                        <span class="font-semibold text-slate-700" data-orders-showing>1–8</span>
                        of
                        <span class="font-semibold text-slate-700" data-orders-total>48</span>
                        orders
                    </p>

                    <nav
                        class="flex flex-wrap items-center gap-1"
                        aria-label="Orders pagination"
                    >
                        <button
                            type="button"
                            class="min-h-9 cursor-not-allowed rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-400"
                            disabled
                        >
                            Previous
                        </button>

                        @for ($page = 1; $page <= 6; $page++)
                            <button
                                type="button"
                                @class([
                                    'inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
                                    'bg-orange-500 text-white' => $page === 1,
                                    'text-slate-600 hover:bg-slate-100' => $page !== 1,
                                ])
                                @if ($page === 1)
                                    aria-current="page"
                                @endif
                            >
                                {{ $page }}
                            </button>
                        @endfor

                        <button
                            type="button"
                            class="min-h-9 cursor-pointer rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-600 transition hover:border-orange-300 hover:text-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                        >
                            Next
                        </button>
                    </nav>
                </div>
            </div>

            <div
                class="hidden px-6 py-16 text-center"
                data-orders-empty
            >
                <span
                    class="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"
                    aria-hidden="true"
                >
                    <i class="fa-solid fa-clipboard-list text-xl"></i>
                </span>
                <h3 class="mt-4 font-semibold text-[#0B1930]">
                    No orders found
                </h3>
                <p class="mt-1 text-sm text-slate-500">
                    Try changing your search or filters.
                </p>
            </div>

            <div
                class="hidden px-6 py-16 text-center"
                role="alert"
                data-orders-error
            >
                <span
                    class="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-red-50 text-red-500"
                    aria-hidden="true"
                >
                    <i class="fa-solid fa-triangle-exclamation text-xl"></i>
                </span>
                <h3 class="mt-4 font-semibold text-[#0B1930]">
                    Unable to load orders
                </h3>
                <p class="mt-1 text-sm text-slate-500">
                    Please try again.
                </p>
                <button
                    type="button"
                    class="mt-5 inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-orange-500 px-4 text-sm font-semibold text-orange-600 transition hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                    data-orders-retry
                >
                    Retry
                </button>
            </div>
        </section>
    </div>
@endsection
