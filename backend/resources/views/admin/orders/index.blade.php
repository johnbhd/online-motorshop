@extends('layouts.admin')

@section('title', 'Admin Orders | ALD Motorshop')

@php
    $orderTabs = [
        ['key' => 'all', 'label' => 'All Orders', 'countKey' => 'total', 'count' => 48],
        ['key' => 'pending', 'label' => 'Pending', 'countKey' => 'pending', 'count' => 8],
        ['key' => 'under_review', 'label' => 'Under Review', 'countKey' => 'under_review', 'count' => 4],
        ['key' => 'confirmed', 'label' => 'Confirmed', 'countKey' => 'confirmed', 'count' => 7],
        ['key' => 'preparing', 'label' => 'Preparing', 'countKey' => 'preparing', 'count' => 6],
        ['key' => 'ready_for_pickup', 'label' => 'Ready for Pickup', 'countKey' => 'ready_for_pickup', 'count' => 4],
        ['key' => 'delivery', 'label' => 'Delivery', 'countKey' => 'delivery', 'count' => 2],
        ['key' => 'completed', 'label' => 'Completed', 'count' => 12],
        ['key' => 'cancelled', 'label' => 'Cancelled', 'count' => 5],
    ];
@endphp

@section('content')
    <div
        class="space-y-5"
        aria-busy="true"
        data-admin-orders
        data-admin-orders-endpoint="{{ route('admin.orders.data') }}"
    >
        <div
            class="hidden rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
            role="alert"
            data-admin-orders-error
        >
            <div
                class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
                <p>Unable to load orders. Please try again.</p>

                <button
                    type="button"
                    class="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    data-admin-orders-retry
                >
                    Retry
                </button>
            </div>
        </div>

        <section
            class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"
            aria-labelledby="admin-orders-heading"
        >
            <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
                    Order Management
                </p>

                <h2
                    id="admin-orders-heading"
                    class="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl"
                >
                    All Customer Orders
                </h2>

                <p class="mt-2 text-sm text-slate-600 sm:text-base">
                    Review, assign, and manage customer orders across all ALD Motorshop branches.
                </p>
            </div>

            <div
                class="inline-flex min-h-11 w-fit items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-800"
            >
                <span
                    class="inline-flex size-8 items-center justify-center rounded-lg bg-white text-orange-600 shadow-sm"
                    aria-hidden="true"
                >
                    <i class="fa-regular fa-clock"></i>
                </span>

                <span>
                    <strong data-admin-orders-attention>8</strong> orders need review
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
                    @foreach ($orderTabs as $tab)
                        <button
                            type="button"
                            @class([
                                'inline-flex min-h-14 cursor-pointer items-center gap-2 border-b-2 px-0.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
                                'border-orange-500 text-[#0B1930]' => $tab['key'] === 'all',
                                'border-transparent text-slate-500 hover:text-[#0B1930]' => $tab['key'] !== 'all',
                            ])
                            role="tab"
                            aria-selected="{{ $tab['key'] === 'all' ? 'true' : 'false' }}"
                            data-admin-orders-tab="{{ $tab['key'] }}"
                        >
                            <span>{{ $tab['label'] }}</span>

                            <span
                                class="inline-flex min-w-6 items-center justify-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-600"
                                @isset($tab['countKey'])
                                    data-admin-orders-tab-count="{{ $tab['countKey'] }}"
                                @endisset
                            >
                                {{ $tab['count'] }}
                            </span>
                        </button>
                    @endforeach
                </div>
            </div>
        </section>

        <section
            class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            aria-label="Order filters"
        >
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(16rem,1fr)_10rem_12rem_11rem_11rem_10rem_auto]">
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
                        data-admin-orders-search
                    >
                </label>

                @foreach ([
                    ['label' => 'Branch', 'data' => 'data-admin-orders-branch', 'options' => ['All Branches' => 'all', 'Manila Branch' => 'Manila', 'Makati Branch' => 'Makati', 'Imus Branch' => 'Imus']],
                    ['label' => 'Fulfillment', 'data' => 'data-admin-orders-fulfillment', 'options' => ['All Fulfillment' => 'all', 'Store Pickup' => 'Store Pickup', 'Lalamove Delivery' => 'Lalamove Delivery']],
                    ['label' => 'Assigned Staff', 'data' => 'data-admin-orders-staff', 'options' => ['All Assigned Staff' => 'all', 'Unassigned' => 'Unassigned', 'Staff User' => 'Staff User', 'Anna Staff' => 'Anna Staff', 'Mark Staff' => 'Mark Staff']],
                    ['label' => 'Status', 'data' => 'data-admin-orders-status', 'options' => ['All Statuses' => 'all', 'Pending' => 'Pending', 'Under Review' => 'Under Review', 'Confirmed' => 'Confirmed', 'Preparing' => 'Preparing', 'Ready for Pickup' => 'Ready for Pickup', 'Waiting for Booking' => 'Waiting for Booking', 'In Transit' => 'In Transit', 'Completed' => 'Completed', 'Cancelled' => 'Cancelled']],
                    ['label' => 'Date', 'data' => 'data-admin-orders-date', 'options' => ['All Dates' => 'all', 'August 8, 2026' => '2026-08-08', 'August 7, 2026' => '2026-08-07']],
                ] as $filter)
                    <label class="relative block">
                        <span class="sr-only">Filter by {{ strtolower($filter['label']) }}</span>
                        <select
                            class="min-h-11 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            {{ $filter['data'] }}
                        >
                            @foreach ($filter['options'] as $optionLabel => $optionValue)
                                <option value="{{ $optionValue }}">
                                    {{ $optionLabel }}
                                </option>
                            @endforeach
                        </select>
                        <i
                            class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                            aria-hidden="true"
                        ></i>
                    </label>
                @endforeach

                <button
                    type="button"
                    class="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                    data-admin-orders-clear
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
            class="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            aria-labelledby="admin-order-list-heading"
            aria-busy="true"
            data-admin-orders-panel
        >
            <div
                class="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
            >
                <div>
                    <h2
                        id="admin-order-list-heading"
                        class="text-lg font-semibold text-[#0B1930]"
                    >
                        Order List
                    </h2>

                    <p class="mt-1 text-sm text-slate-500">
                        <span data-admin-orders-total-label>48</span> customer orders
                    </p>
                </div>

                <label class="relative block w-full sm:w-44">
                    <span class="sr-only">Sort orders</span>
                    <select
                        class="min-h-10 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        data-admin-orders-sort
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="reference">Order Reference</option>
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
                data-admin-orders-loading
            >
                <span class="sr-only">Loading customer orders.</span>

                <div class="overflow-x-auto">
                    <table class="w-full min-w-[1250px] border-collapse">
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
                data-admin-orders-content
            >
                <div class="overflow-x-auto">
                    <table class="w-full min-w-[1250px] border-collapse text-left">
                        <thead class="bg-slate-50">
                            <tr class="border-b border-slate-200">
                                @foreach (['Order', 'Customer', 'Branch', 'Amount', 'Fulfillment', 'Assigned Staff', 'Status', 'Updated', 'Action'] as $column)
                                    <th
                                        scope="col"
                                        class="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                                    >
                                        {{ $column }}
                                    </th>
                                @endforeach
                            </tr>
                        </thead>

                        <tbody
                            class="divide-y divide-slate-100"
                            data-admin-orders-body
                        ></tbody>
                    </table>
                </div>

                <div
                    class="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                    <p class="text-sm text-slate-500">
                        Showing
                        <span
                            class="font-semibold text-slate-700"
                            data-admin-orders-showing
                        >
                            1–8
                        </span>
                        of
                        <span
                            class="font-semibold text-slate-700"
                            data-admin-orders-total
                        >
                            48
                        </span>
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
                data-admin-orders-empty
            >
                <span
                    class="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"
                    aria-hidden="true"
                >
                    <i class="fa-regular fa-clipboard text-xl"></i>
                </span>

                <h3 class="mt-4 font-semibold text-[#0B1930]">
                    No orders found
                </h3>

                <p class="mt-1 text-sm text-slate-500">
                    Try changing your search or filters.
                </p>
            </div>
        </section>
    </div>
@endsection
