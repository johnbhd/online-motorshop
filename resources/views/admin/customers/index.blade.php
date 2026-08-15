@extends('layouts.admin')

@section('title', 'Admin Customers | ALD Motorshop')

@php
    $summaryCards = [
        [
            'key' => 'total',
            'label' => 'Total Customers',
            'icon' => 'fa-solid fa-users',
            'tone' => 'blue',
        ],
        [
            'key' => 'customers_this_month',
            'label' => 'Customers This Month',
            'icon' => 'fa-regular fa-calendar',
            'tone' => 'orange',
        ],
        [
            'key' => 'returning',
            'label' => 'Returning Customers',
            'icon' => 'fa-solid fa-rotate',
            'tone' => 'green',
        ],
    ];

    $customerTabs = [
        ['key' => 'all', 'label' => 'All Customers', 'summaryKey' => 'total'],
        ['key' => 'Registered', 'label' => 'Registered', 'summaryKey' => 'registered'],
        ['key' => 'Guest', 'label' => 'Guest', 'summaryKey' => 'guest'],
        ['key' => 'Returning', 'label' => 'Returning', 'summaryKey' => 'returning'],
        ['key' => 'New', 'label' => 'New'],
    ];

    $tableColumns = [
        'Customer',
        'Type',
        'Contact',
        'Location',
        'Orders',
        'Total Ordered',
        'Last Order',
        'Status',
        'Action',
    ];
@endphp

@section('content')
    <div
        class="space-y-5"
        aria-busy="true"
        data-admin-customers
        data-admin-customers-endpoint="{{ route('admin.customers.data') }}"
    >
        <div
            class="hidden rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
            role="alert"
            data-customer-error
        >
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p>Unable to load customers. Please try again.</p>

                <button
                    type="button"
                    class="inline-flex min-h-9 w-fit cursor-pointer items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-2 font-semibold transition hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    data-customer-retry
                >
                    Retry
                </button>
            </div>
        </div>

        <section
            class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"
            aria-labelledby="customers-page-heading"
        >
            <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
                    Customer Records
                </p>

                <h2
                    id="customers-page-heading"
                    class="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl"
                >
                    Customers
                </h2>

                <p class="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
                    View customer contact information, order activity, and customer history across ALD Motorshop.
                </p>
            </div>

            <div class="inline-flex min-h-11 w-fit items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#0B1930] shadow-sm">
                <span
                    class="inline-flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500"
                    aria-hidden="true"
                >
                    <i class="fa-solid fa-users"></i>
                </span>

                <span>
                    <span data-customer-header-total>124</span> customer records
                </span>
            </div>
        </section>

        <section aria-label="Customer summary">
            <div
                class="grid grid-cols-1 gap-4 sm:grid-cols-3"
                data-customer-summary-loading
            >
                @for ($index = 0; $index < 3; $index++)
                    <x-skeleton type="stat" />
                @endfor
            </div>

            <div
                class="hidden grid grid-cols-1 gap-4 sm:grid-cols-3"
                data-customer-summary-content
            >
                @foreach ($summaryCards as $card)
                    <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div class="flex items-start gap-4">
                            <span
                                @class([
                                    'inline-flex size-11 shrink-0 items-center justify-center rounded-lg',
                                    'bg-blue-50 text-blue-700' => $card['tone'] === 'blue',
                                    'bg-orange-50 text-orange-600' => $card['tone'] === 'orange',
                                    'bg-emerald-50 text-emerald-700' => $card['tone'] === 'green',
                                ])
                                aria-hidden="true"
                            >
                                <i class="{{ $card['icon'] }} text-lg"></i>
                            </span>

                            <div>
                                <p
                                    class="text-3xl font-bold tracking-tight text-[#0B1930]"
                                    data-customer-summary="{{ $card['key'] }}"
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
                    aria-label="Filter customers by type and activity"
                >
                    @foreach ($customerTabs as $tab)
                        <button
                            type="button"
                            @class([
                                'inline-flex min-h-14 cursor-pointer items-center gap-2 border-b-2 px-0.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500',
                                'border-orange-500 text-[#0B1930]' => $tab['key'] === 'all',
                                'border-transparent text-slate-500 hover:text-[#0B1930]' => $tab['key'] !== 'all',
                            ])
                            role="tab"
                            aria-selected="{{ $tab['key'] === 'all' ? 'true' : 'false' }}"
                            data-customer-tab="{{ $tab['key'] }}"
                        >
                            <span>{{ $tab['label'] }}</span>

                            @if (isset($tab['summaryKey']))
                                <span
                                    class="inline-flex min-w-6 justify-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-600"
                                    data-customer-tab-count="{{ $tab['summaryKey'] }}"
                                >
                                    &mdash;
                                </span>
                            @endif
                        </button>
                    @endforeach
                </div>
            </div>
        </section>

        <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(17rem,1fr)_11rem_11rem_12rem_auto]">
                <label class="relative block">
                    <span class="sr-only">Search customers</span>

                    <i
                        class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400"
                        aria-hidden="true"
                    ></i>

                    <input
                        type="search"
                        class="min-h-11 w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        placeholder="Search customer name, contact number, or email"
                        data-customer-search
                    >
                </label>

                <label class="relative block">
                    <span class="sr-only">Filter by branch</span>

                    <select
                        class="min-h-11 w-full appearance-none rounded-lg border border-slate-300 px-3.5 py-2.5 pr-9 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        data-customer-branch
                    >
                        <option value="all">All Branches</option>
                        <option value="Manila">Manila Branch</option>
                        <option value="Makati">Makati Branch</option>
                        <option value="Imus">Imus Branch</option>
                    </select>

                    <i
                        class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                        aria-hidden="true"
                    ></i>
                </label>

                <label class="relative block">
                    <span class="sr-only">Filter by customer type</span>

                    <select
                        class="min-h-11 w-full appearance-none rounded-lg border border-slate-300 px-3.5 py-2.5 pr-9 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        data-customer-type
                    >
                        <option value="all">All Customers</option>
                        <option value="Registered">Registered</option>
                        <option value="Guest">Guest</option>
                    </select>

                    <i
                        class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                        aria-hidden="true"
                    ></i>
                </label>

                <label class="relative block">
                    <span class="sr-only">Filter by customer activity</span>

                    <select
                        class="min-h-11 w-full appearance-none rounded-lg border border-slate-300 px-3.5 py-2.5 pr-9 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        data-customer-activity
                    >
                        <option value="all">All Activity</option>
                        <option value="Returning">Returning</option>
                        <option value="New">New</option>
                        <option value="active-orders">Has Active Orders</option>
                        <option value="no-recent-orders">No Recent Orders</option>
                    </select>

                    <i
                        class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                        aria-hidden="true"
                    ></i>
                </label>

                <button
                    type="button"
                    class="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-[#0B1930] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                    data-customer-clear
                >
                    <i
                        class="fa-solid fa-rotate-left text-xs"
                        aria-hidden="true"
                    ></i>

                    Clear
                </button>
            </div>
        </section>

        <section class="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div class="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                    <h2 class="text-lg font-semibold text-[#0B1930]">
                        Customer List
                    </h2>

                    <p class="mt-1 text-sm text-slate-500">
                        <span data-customer-total-label>124</span> customer records
                    </p>
                </div>

                <label class="relative block">
                    <span class="sr-only">Sort customers</span>

                    <select
                        class="min-h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 sm:w-44"
                        data-customer-sort
                    >
                        <option value="newest">Newest Activity</option>
                        <option value="oldest">Oldest Activity</option>
                        <option value="name">Name A&ndash;Z</option>
                        <option value="orders">Most Orders</option>
                    </select>

                    <i
                        class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                        aria-hidden="true"
                    ></i>
                </label>
            </div>

            <div data-customer-loading>
                <div class="overflow-x-auto">
                    <table class="w-full min-w-[1150px]">
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
                data-customer-content
            >
                <div class="overflow-x-auto">
                    <table class="w-full min-w-[1150px] text-left">
                        <thead class="bg-slate-50">
                            <tr>
                                @foreach ($tableColumns as $column)
                                    <th class="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        {{ $column }}
                                    </th>
                                @endforeach
                            </tr>
                        </thead>

                        <tbody
                            class="divide-y divide-slate-100"
                            data-customer-body
                        ></tbody>
                    </table>
                </div>

                <div class="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p class="text-sm text-slate-500">
                        Showing <span data-customer-showing>1&ndash;8</span> of <span data-customer-total>124</span> customers
                    </p>

                    <nav
                        class="flex items-center gap-1 text-sm font-medium"
                        aria-label="Customer list pagination"
                    >
                        <button
                            type="button"
                            class="min-h-9 rounded-lg px-2.5 text-slate-400"
                            disabled
                        >
                            Previous
                        </button>

                        <button
                            type="button"
                            class="inline-flex size-9 items-center justify-center rounded-lg bg-orange-500 text-white"
                            aria-current="page"
                        >
                            1
                        </button>

                        @foreach ([2, 3, 4, 5] as $page)
                            <button
                                type="button"
                                class="inline-flex size-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100"
                            >
                                {{ $page }}
                            </button>
                        @endforeach

                        <span class="px-1 text-slate-400">&hellip;</span>

                        <button
                            type="button"
                            class="inline-flex size-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100"
                        >
                            16
                        </button>

                        <button
                            type="button"
                            class="min-h-9 rounded-lg px-2.5 text-slate-600 transition hover:bg-slate-100"
                        >
                            Next
                        </button>
                    </nav>
                </div>
            </div>

            <div
                class="hidden px-6 py-16 text-center"
                data-customer-empty
            >
                <span
                    class="inline-flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"
                    aria-hidden="true"
                >
                    <i class="fa-solid fa-users text-lg"></i>
                </span>

                <h3 class="mt-4 font-semibold text-[#0B1930]">
                    No customers found
                </h3>

                <p class="mt-1 text-sm text-slate-500">
                    Try changing your search or filters.
                </p>
            </div>
        </section>
    </div>
@endsection
