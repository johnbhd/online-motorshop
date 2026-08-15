@extends('layouts.admin')

@section('title', 'Admin Payments | ALD Motorshop')

@php
    $paymentTabs = [
        ['key' => 'all', 'label' => 'All Payments', 'count' => 41],
        ['key' => 'unpaid', 'label' => 'Unpaid', 'count' => 1],
        ['key' => 'waiting_payment', 'label' => 'Waiting for Payment', 'count' => 1],
        ['key' => 'waiting_verification', 'label' => 'Waiting for Verification', 'count' => 3],
        ['key' => 'paid', 'label' => 'Paid', 'count' => 36],
        ['key' => 'failed', 'label' => 'Failed', 'count' => 1],
        ['key' => 'refunded', 'label' => 'Refunded', 'count' => 1],
        ['key' => 'cancelled', 'label' => 'Cancelled', 'count' => 1],
    ];

    $summaryCards = [
        ['key' => 'total', 'label' => 'Total Payments', 'description' => 'All payment records', 'icon' => 'fa-regular fa-credit-card', 'tone' => 'blue'],
        ['key' => 'paid', 'label' => 'Paid', 'description' => 'Verified customer payments', 'icon' => 'fa-solid fa-circle-check', 'tone' => 'green'],
        ['key' => 'waiting_for_verification', 'label' => 'Waiting for Verification', 'description' => 'Proof awaiting review', 'icon' => 'fa-regular fa-clock', 'tone' => 'orange'],
        ['key' => 'failed_refunded', 'label' => 'Failed / Refunded', 'description' => 'Payments needing follow-up', 'icon' => 'fa-solid fa-circle-exclamation', 'tone' => 'red'],
    ];

    $paymentFilters = [
        [
            'data' => 'data-admin-payments-branch',
            'options' => [
                'All Branches' => 'all',
                'Manila Branch' => 'Manila',
                'Makati Branch' => 'Makati',
                'Imus Branch' => 'Imus',
            ],
        ],
        [
            'data' => 'data-admin-payments-method',
            'options' => [
                'All Payment Methods' => 'all',
                'Online Payment' => 'Online Payment',
                'Cash / Pay at Branch' => 'Cash / Pay at Branch',
            ],
        ],
        [
            'data' => 'data-admin-payments-status',
            'options' => [
                'All Payment Statuses' => 'all',
                'Unpaid' => 'Unpaid',
                'Waiting for Payment' => 'Waiting for Payment',
                'Waiting for Verification' => 'Waiting for Verification',
                'Paid' => 'Paid',
                'Failed' => 'Failed',
                'Refunded' => 'Refunded',
                'Cancelled' => 'Cancelled',
            ],
        ],
        [
            'data' => 'data-admin-payments-date',
            'options' => [
                'All Dates' => 'all',
                'August 8, 2026' => '2026-08-08',
                'August 7, 2026' => '2026-08-07',
                'August 6, 2026' => '2026-08-06',
            ],
        ],
    ];

    $paymentColumns = [
        'Order',
        'Customer',
        'Order Total',
        'Method',
        'Amount Paid',
        'Payment Status',
        'Verified By',
        'Payment Date',
        'Action',
    ];
@endphp

@section('content')
    <div
        class="space-y-5"
        aria-busy="true"
        data-admin-payments
        data-admin-payments-endpoint="{{ route('admin.payments.data') }}"
    >
        <section class="rounded-xl border border-slate-200 bg-white px-4 shadow-sm sm:px-5">
            <div class="overflow-x-auto">
                <div
                    class="flex min-w-max items-center gap-6"
                    role="tablist"
                    aria-label="Payments navigation"
                >
                    @foreach (['Payment Records', 'Verifications Queue', 'Refunds', 'Payment Reports'] as $index => $label)
                        <button
                            type="button"
                            @class([
                                'inline-flex min-h-14 cursor-pointer items-center border-b-2 px-0.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
                                'border-orange-500 text-[#0B1930]' => $index === 0,
                                'border-transparent text-slate-500 hover:text-[#0B1930]' => $index !== 0,
                            ])
                            aria-selected="{{ $index === 0 ? 'true' : 'false' }}"
                        >
                            {{ $label }}
                        </button>
                    @endforeach
                </div>
            </div>
        </section>

        <div
            class="hidden rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
            role="alert"
            data-admin-payments-error
        >
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p>Unable to load payments. Please try again.</p>

                <button
                    type="button"
                    class="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    data-admin-payments-retry
                >
                    Retry
                </button>
            </div>
        </div>

        <section
            class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"
            aria-labelledby="admin-payments-heading"
        >
            <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
                    Payment Management
                </p>

                <h2
                    id="admin-payments-heading"
                    class="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl"
                >
                    Customer Payments
                </h2>

                <p class="mt-2 text-sm text-slate-600 sm:text-base">
                    Review payment records, verify proof of payment, manage refunds, and monitor payment activity.
                </p>
            </div>

            <div class="inline-flex min-h-11 w-fit items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-800">
                <span
                    class="inline-flex size-8 items-center justify-center rounded-lg bg-white text-orange-600 shadow-sm"
                    aria-hidden="true"
                >
                    <i
                        class="fa-regular fa-clock"
                        aria-hidden="true"
                    ></i>
                </span>

                <span>
                    <strong data-admin-payments-attention>3</strong>
                    payments waiting for verification
                </span>
            </div>
        </section>

        <section aria-label="Payment summary">
            <div
                class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
                role="status"
                aria-live="polite"
                data-admin-payments-summary-loading
            >
                <span class="sr-only">Loading payment summary.</span>

                @for ($cardIndex = 0; $cardIndex < 4; $cardIndex++)
                    <x-skeleton type="stat" />
                @endfor
            </div>

            <div
                class="hidden grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
                data-admin-payments-summary-content
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
                                    'bg-red-50 text-red-600' => $card['tone'] === 'red',
                                ])
                                aria-hidden="true"
                            >
                                <i
                                    class="{{ $card['icon'] }} text-lg"
                                    aria-hidden="true"
                                ></i>
                            </span>

                            <div class="min-w-0">
                                <p
                                    class="text-3xl font-bold tracking-tight text-[#0B1930]"
                                    data-admin-payments-summary="{{ $card['key'] }}"
                                >
                                    &mdash;
                                </p>

                                <h3 class="mt-1 font-semibold text-[#0B1930]">
                                    {{ $card['label'] }}
                                </h3>

                                <p class="mt-1 text-sm text-slate-500">
                                    {{ $card['description'] }}
                                </p>
                            </div>
                        </div>
                    </article>
                @endforeach
            </div>
        </section>

        <section
            class="rounded-xl border border-slate-200 bg-white px-4 shadow-sm sm:px-5"
            aria-label="Payment status navigation"
        >
            <div class="overflow-x-auto">
                <div
                    class="flex min-w-max items-center gap-6"
                    role="tablist"
                    aria-label="Filter payments by status"
                >
                    @foreach ($paymentTabs as $tab)
                        <button
                            type="button"
                            @class([
                                'inline-flex min-h-14 cursor-pointer items-center gap-2 border-b-2 px-0.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
                                'border-orange-500 text-[#0B1930]' => $tab['key'] === 'all',
                                'border-transparent text-slate-500 hover:text-[#0B1930]' => $tab['key'] !== 'all',
                            ])
                            aria-selected="{{ $tab['key'] === 'all' ? 'true' : 'false' }}"
                            data-admin-payments-tab="{{ $tab['key'] }}"
                        >
                            <span>{{ $tab['label'] }}</span>

                            <span class="inline-flex min-w-6 items-center justify-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-600">
                                {{ $tab['count'] }}
                            </span>
                        </button>
                    @endforeach
                </div>
            </div>
        </section>

        <section
            class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            aria-label="Payment filters"
        >
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(16rem,1fr)_10rem_13rem_13rem_10rem_auto]">
                <label class="relative block">
                    <span class="sr-only">Search payments</span>

                    <i
                        class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400"
                        aria-hidden="true"
                    ></i>

                    <input
                        type="search"
                        class="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-[#0B1930] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        placeholder="Search order reference, customer, or payment reference"
                        data-admin-payments-search
                    >
                </label>

                @foreach ($paymentFilters as $filter)
                    <label class="relative block">
                        <span class="sr-only">Filter payments</span>

                        <select
                            class="min-h-11 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            {{ $filter['data'] }}
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
                    class="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                    data-admin-payments-clear
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
            aria-labelledby="payment-records-heading"
            aria-busy="true"
            data-admin-payments-panel
        >
            <div class="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                    <h2
                        id="payment-records-heading"
                        class="text-lg font-semibold text-[#0B1930]"
                    >
                        Payment Records
                    </h2>

                    <p class="mt-1 text-sm text-slate-500">
                        <span data-admin-payments-total-label>41</span>
                        payment records
                    </p>
                </div>

                <label class="relative block w-full sm:w-44">
                    <span class="sr-only">Sort payments</span>

                    <select
                        class="min-h-10 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        data-admin-payments-sort
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="order">Order Reference</option>
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
                data-admin-payments-loading
            >
                <span class="sr-only">Loading payment records.</span>

                <div class="overflow-x-auto">
                    <table class="w-full min-w-[1250px] border-collapse">
                        <tbody>
                            @for ($rowIndex = 0; $rowIndex < 8; $rowIndex++)
                                <x-skeleton type="table-row" :columns="9" />
                            @endfor
                        </tbody>
                    </table>
                </div>
            </div>

            <div
                class="hidden"
                data-admin-payments-content
            >
                <div class="overflow-x-auto">
                    <table class="w-full min-w-[1250px] border-collapse text-left">
                        <thead class="bg-slate-50">
                            <tr class="border-b border-slate-200">
                                @foreach ($paymentColumns as $column)
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
                            data-admin-payments-body
                        >
                        </tbody>
                    </table>
                </div>

                <div class="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p class="text-sm text-slate-500">
                        Showing <span class="font-semibold text-slate-700" data-admin-payments-showing>1&ndash;8</span> of <span class="font-semibold text-slate-700" data-admin-payments-total>41</span> payments
                    </p>

                    <nav
                        class="flex flex-wrap items-center gap-1"
                        aria-label="Payments pagination"
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
                            class="min-h-9 cursor-pointer rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-600 transition hover:border-orange-300 hover:text-orange-600"
                        >
                            Next
                        </button>
                    </nav>
                </div>
            </div>

            <div
                class="hidden px-6 py-16 text-center"
                data-admin-payments-empty
            >
                <span
                    class="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"
                    aria-hidden="true"
                >
                    <i
                        class="fa-regular fa-credit-card text-xl"
                        aria-hidden="true"
                    ></i>
                </span>

                <h3 class="mt-4 font-semibold text-[#0B1930]">
                    No payments found
                </h3>

                <p class="mt-1 text-sm text-slate-500">
                    Try changing your search or filters.
                </p>
            </div>
        </section>
    </div>
@endsection
