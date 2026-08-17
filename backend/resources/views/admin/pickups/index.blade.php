@extends('layouts.admin')

@section('title', 'Admin Pickup Requests | ALD Motorshop')

@php
    $summaryCards = [
        ['key' => 'active_pickups', 'label' => 'Active Pickups', 'icon' => 'fa-solid fa-box', 'tone' => 'blue'],
        ['key' => 'ready_for_pickup', 'label' => 'Ready for Pickup', 'icon' => 'fa-solid fa-circle-check', 'tone' => 'green'],
        ['key' => 'completed_today', 'label' => 'Completed Today', 'icon' => 'fa-regular fa-clipboard', 'tone' => 'orange'],
    ];

    $pickupTabs = [
        ['key' => 'all', 'label' => 'All Pickup Requests', 'count' => 22],
        ['key' => 'preparing', 'label' => 'Preparing', 'count' => 2],
        ['key' => 'ready', 'label' => 'Ready for Pickup', 'count' => 2],
        ['key' => 'completed', 'label' => 'Completed', 'count' => 16],
        ['key' => 'cancelled', 'label' => 'Cancelled', 'count' => 1],
    ];

    $pickupFilters = [
        [
            'attribute' => 'data-admin-pickups-branch',
            'options' => [
                'All Branches' => 'all',
                'Manila Branch' => 'Manila',
                'Makati Branch' => 'Makati',
                'Imus Branch' => 'Imus',
            ],
        ],
        [
            'attribute' => 'data-admin-pickups-status',
            'options' => [
                'All Pickup Statuses' => 'all',
                'Preparing' => 'Preparing',
                'Ready for Pickup' => 'Ready for Pickup',
                'Completed' => 'Completed',
                'Cancelled' => 'Cancelled',
            ],
        ],
        [
            'attribute' => 'data-admin-pickups-staff',
            'options' => [
                'All Staff' => 'all',
                'Staff User' => 'Staff User',
                'Anna Staff' => 'Anna Staff',
                'Mark Staff' => 'Mark Staff',
                'Unassigned' => 'â€”',
            ],
        ],
        [
            'attribute' => 'data-admin-pickups-date',
            'options' => [
                'All Dates' => 'all',
                'August 8, 2026' => '2026-08-08',
                'August 7, 2026' => '2026-08-07',
                'August 6, 2026' => '2026-08-06',
            ],
        ],
    ];

    $pickupTableColumns = [
        'Order',
        'Customer',
        'Pickup Branch',
        'Schedule',
        'Amount',
        'Payment',
        'Assigned Staff',
        'Pickup Status',
        'Action',
    ];
@endphp

@section('content')
    <div
        class="space-y-5"
        aria-busy="true"
        data-admin-pickups
        data-admin-pickups-endpoint="{{ route('admin.pickups.data') }}"
    >
        <div
            class="hidden rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
            role="alert"
            data-admin-pickups-error
        >
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p>Unable to load pickup requests. Please try again.</p>

                <button
                    type="button"
                    class="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-2 font-semibold"
                    data-admin-pickups-retry
                >
                    Retry
                </button>
            </div>
        </div>

        <section class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
                    Pickup Management
                </p>

                <h2 class="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl">
                    Store Pickup Requests
                </h2>

                <p class="mt-2 text-sm text-slate-600 sm:text-base">
                    Monitor branch pickup orders, preparation status, ready orders, and completed pickups.
                </p>
            </div>

            <div class="inline-flex min-h-11 w-fit items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-800">
                <span class="inline-flex size-8 items-center justify-center rounded-lg bg-white text-orange-600 shadow-sm">
                    <i
                        class="fa-regular fa-clock"
                        aria-hidden="true"
                    ></i>
                </span>

                <span>
                    <strong data-admin-pickups-active>4</strong>
                    active pickup requests
                </span>
            </div>
        </section>

        <section aria-label="Pickup summary">
            <div
                class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
                data-admin-pickups-summary-loading
            >
                @for ($index = 0; $index < 3; $index++)
                    <x-skeleton type="stat" />
                @endfor
            </div>

            <div
                class="hidden grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
                data-admin-pickups-summary-content
            >
                @foreach ($summaryCards as $card)
                    <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div class="flex items-start gap-4">
                            <span
                                @class([
                                    'inline-flex size-11 shrink-0 items-center justify-center rounded-lg',
                                    'bg-blue-50 text-blue-700' => $card['tone'] === 'blue',
                                    'bg-emerald-50 text-emerald-700' => $card['tone'] === 'green',
                                    'bg-orange-50 text-orange-600' => $card['tone'] === 'orange',
                                ])
                            >
                                <i
                                    class="{{ $card['icon'] }} text-lg"
                                    aria-hidden="true"
                                ></i>
                            </span>

                            <div>
                                <p
                                    class="text-3xl font-bold text-[#0B1930]"
                                    data-admin-pickups-summary="{{ $card['key'] }}"
                                >
                                    &mdash;
                                </p>

                                <h3 class="mt-1 font-semibold text-[#0B1930]">
                                    {{ $card['label'] }}
                                </h3>
                            </div>
                        </div>
                    </article>
                @endforeach
            </div>
        </section>

        <section class="rounded-xl border border-slate-200 bg-white px-4 shadow-sm sm:px-5">
            <div class="overflow-x-auto">
                <div
                    class="flex min-w-max items-center gap-6"
                    role="tablist"
                    aria-label="Filter pickup requests by status"
                >
                    @foreach ($pickupTabs as $tab)
                        <button
                            type="button"
                            @class([
                                'inline-flex min-h-14 cursor-pointer items-center gap-2 border-b-2 px-0.5 text-sm font-semibold',
                                'border-orange-500 text-[#0B1930]' => $tab['key'] === 'all',
                                'border-transparent text-slate-500' => $tab['key'] !== 'all',
                            ])
                            data-admin-pickups-tab="{{ $tab['key'] }}"
                        >
                            <span>{{ $tab['label'] }}</span>

                            <span class="inline-flex min-w-6 justify-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px]">
                                {{ $tab['count'] }}
                            </span>
                        </button>
                    @endforeach
                </div>
            </div>
        </section>

        <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(16rem,1fr)_10rem_13rem_11rem_10rem_auto]">
                <label class="relative block">
                    <span class="sr-only">Search pickup requests</span>

                    <i
                        class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400"
                        aria-hidden="true"
                    ></i>

                    <input
                        type="search"
                        class="min-h-11 w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm"
                        placeholder="Search order reference or customer name"
                        data-admin-pickups-search
                    >
                </label>

                @foreach ($pickupFilters as $filter)
                    <label class="relative block">
                        <span class="sr-only">Filter pickup requests</span>

                        <select
                            class="min-h-11 w-full appearance-none rounded-lg border border-slate-300 px-3.5 py-2.5 pr-9 text-sm"
                            {{ $filter['attribute'] }}
                        >
                            @foreach ($filter['options'] as $label => $value)
                                <option value="{{ $value }}">
                                    {{ $label }}
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
                    class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-500"
                    data-admin-pickups-clear
                >
                    <i
                        class="fa-solid fa-rotate-left text-xs"
                        aria-hidden="true"
                    ></i>

                    Clear
                </button>
            </div>
        </section>

        <section
            class="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            data-admin-pickups-panel
        >
            <div class="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                    <h2 class="text-lg font-semibold text-[#0B1930]">
                        Pickup Requests
                    </h2>

                    <p class="mt-1 text-sm text-slate-500">
                        <span data-admin-pickups-total-label>22</span>
                        pickup orders
                    </p>
                </div>

                <select
                    class="min-h-10 rounded-lg border border-slate-300 px-3 text-sm"
                    data-admin-pickups-sort
                >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                </select>
            </div>

            <div data-admin-pickups-loading>
                <div class="overflow-x-auto">
                    <table class="w-full min-w-[1180px]">
                        <tbody>
                            @for ($index = 0; $index < 8; $index++)
                                <x-skeleton type="table-row" :columns="9" />
                            @endfor
                        </tbody>
                    </table>
                </div>
            </div>

            <div
                class="hidden"
                data-admin-pickups-content
            >
                <div class="overflow-x-auto">
                    <table class="w-full min-w-[1180px] text-left">
                        <thead class="bg-slate-50">
                            <tr>
                                @foreach ($pickupTableColumns as $column)
                                    <th class="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        {{ $column }}
                                    </th>
                                @endforeach
                            </tr>
                        </thead>

                        <tbody
                            class="divide-y divide-slate-100"
                            data-admin-pickups-body
                        >
                        </tbody>
                    </table>
                </div>

                <div class="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p class="text-sm text-slate-500">
                        Showing <span data-admin-pickups-showing>1&ndash;8</span> of <span data-admin-pickups-total>22</span> pickup requests
                    </p>

                    <nav class="flex gap-1">
                        <button
                            type="button"
                            disabled
                        >
                            Previous
                        </button>

                        <button
                            type="button"
                            class="rounded-lg bg-orange-500 px-3 py-2 text-white"
                        >
                            1
                        </button>

                        <button
                            type="button"
                            class="px-3"
                        >
                            2
                        </button>

                        <button
                            type="button"
                            class="px-3"
                        >
                            3
                        </button>

                        <button type="button">Next</button>
                    </nav>
                </div>
            </div>

            <div
                class="hidden px-6 py-16 text-center"
                data-admin-pickups-empty
            >
                <h3 class="font-semibold text-[#0B1930]">
                    No pickup requests found
                </h3>

                <p class="mt-1 text-sm text-slate-500">
                    Try changing your search or filters.
                </p>
            </div>
        </section>

        <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div class="border-b border-slate-200 px-5 py-5">
                <h2 class="text-lg font-semibold text-[#0B1930]">
                    Pickup by Branch
                </h2>
            </div>

            <div
                class="p-5"
                data-admin-pickups-branches-loading
            >
                <x-skeleton type="list" :rows="3" />
            </div>

            <div
                class="hidden overflow-x-auto"
                data-admin-pickups-branches-content
            >
                <table class="w-full min-w-[600px] text-left">
                    <thead class="bg-slate-50">
                        <tr>
                            <th class="px-5 py-3 text-xs uppercase text-slate-500">
                                Branch
                            </th>

                            <th class="px-5 py-3 text-xs uppercase text-slate-500">
                                Pickup Requests
                            </th>

                            <th class="px-5 py-3 text-xs uppercase text-slate-500">
                                Breakdown
                            </th>
                        </tr>
                    </thead>

                    <tbody data-admin-pickups-branches>
                    </tbody>
                </table>
            </div>
        </section>
    </div>
@endsection
