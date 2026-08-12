@extends('layouts.staff')

@section('title', 'Staff Customers | ALD Motorshop')
@section('header-title', 'Customers')

@php
    $customerTabs = [
        ['key' => 'all', 'label' => 'All Customers', 'countKey' => 'total', 'count' => 124],
        ['key' => 'registered', 'label' => 'Registered', 'countKey' => 'registered', 'count' => 47],
        ['key' => 'guest', 'label' => 'Guest', 'countKey' => 'guest', 'count' => 77],
        ['key' => 'active', 'label' => 'With Active Orders', 'countKey' => 'active_orders', 'count' => 18],
    ];

    $summaryCards = [
        ['key' => 'total', 'label' => 'Total Customers', 'description' => 'Guest + Registered', 'icon' => 'fa-solid fa-users', 'tone' => 'orange'],
        ['key' => 'registered', 'label' => 'Registered Customers', 'description' => 'With ALD accounts', 'icon' => 'fa-solid fa-user-check', 'tone' => 'blue'],
        ['key' => 'guest', 'label' => 'Guest Customers', 'description' => 'Checkout without account', 'icon' => 'fa-regular fa-user', 'tone' => 'slate'],
        ['key' => 'active_orders', 'label' => 'Active Orders', 'description' => 'Across all customers', 'icon' => 'fa-solid fa-clipboard-list', 'tone' => 'orange'],
    ];
@endphp

@section('content')
    <div
        class="space-y-5"
        data-staff-customers
        data-customers-endpoint="{{ route('staff.customers.data') }}"
    >
        <section
            class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"
            aria-labelledby="customers-page-heading"
        >
            <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
                    Customer Management
                </p>

                <h2
                    id="customers-page-heading"
                    class="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl"
                >
                    Customers
                </h2>

                <p class="mt-2 text-sm text-slate-600 sm:text-base">
                    View customer information, order activity, and related interactions.
                </p>
            </div>

            <div class="inline-flex min-h-11 w-fit items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-800">
                <span class="inline-flex size-8 items-center justify-center rounded-lg bg-white text-orange-600 shadow-sm" aria-hidden="true">
                    <i class="fa-solid fa-users"></i>
                </span>

                <span><strong data-customers-header-total>124</strong> customers</span>
            </div>
        </section>

        <section aria-label="Customer summary">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" role="status" aria-live="polite" data-customers-summary-loading>
                <span class="sr-only">Loading customer summary.</span>

                @for ($cardIndex = 0; $cardIndex < 4; $cardIndex++)
                    <x-skeleton type="stat" />
                @endfor
            </div>

            <div class="hidden grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" data-customers-summary-content>
                @foreach ($summaryCards as $card)
                    <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div class="flex items-start gap-4">
                            <span @class([
                                'inline-flex size-11 shrink-0 items-center justify-center rounded-lg',
                                'bg-orange-50 text-orange-600' => $card['tone'] === 'orange',
                                'bg-blue-50 text-blue-700' => $card['tone'] === 'blue',
                                'bg-slate-100 text-slate-600' => $card['tone'] === 'slate',
                            ]) aria-hidden="true">
                                <i class="{{ $card['icon'] }} text-lg"></i>
                            </span>

                            <div class="min-w-0">
                                <p class="text-3xl font-bold tracking-tight text-[#0B1930]" data-customers-summary="{{ $card['key'] }}"></p>
                                <h3 class="mt-1 font-semibold text-[#0B1930]">{{ $card['label'] }}</h3>
                                <p class="mt-1 text-sm text-slate-500">{{ $card['description'] }}</p>
                            </div>
                        </div>
                    </article>
                @endforeach
            </div>
        </section>

        <section class="rounded-xl border border-slate-200 bg-white px-4 shadow-sm sm:px-5" aria-label="Customer type navigation">
            <div class="overflow-x-auto">
                <div class="flex min-w-max items-center gap-6" role="tablist" aria-label="Filter customers by type">
                    @foreach ($customerTabs as $tab)
                        <button
                            type="button"
                            @class([
                                'inline-flex min-h-14 cursor-pointer items-center gap-2 border-b-2 px-0.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
                                'border-orange-500 text-[#0B1930]' => $tab['key'] === 'all',
                                'border-transparent text-slate-500 hover:text-[#0B1930]' => $tab['key'] !== 'all',
                            ])
                            role="tab"
                            aria-selected="{{ $tab['key'] === 'all' ? 'true' : 'false' }}"
                            data-customers-tab="{{ $tab['key'] }}"
                        >
                            <span>{{ $tab['label'] }}</span>

                            <span class="inline-flex min-w-6 items-center justify-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-600" data-customers-tab-count="{{ $tab['countKey'] }}">
                                {{ $tab['count'] }}
                            </span>
                        </button>
                    @endforeach
                </div>
            </div>
        </section>

        <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="Customer filters">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(18rem,1fr)_12rem_11rem_13rem_auto]">
                <label class="relative block">
                    <span class="sr-only">Search customers</span>
                    <i class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" aria-hidden="true"></i>
                    <input type="search" class="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-[#0B1930] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100" placeholder="Search customer name, email, or contact number" data-customers-search>
                </label>

                <label class="relative block">
                    <span class="sr-only">Filter by customer type</span>
                    <select class="min-h-11 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" data-customers-type>
                        <option value="all">All Customer Types</option>
                        <option value="Registered">Registered</option>
                        <option value="Guest">Guest</option>
                    </select>
                    <i class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" aria-hidden="true"></i>
                </label>

                <label class="relative block">
                    <span class="sr-only">Filter by branch</span>
                    <select class="min-h-11 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" data-customers-branch>
                        <option value="all">All Branches</option>
                        <option value="Manila">Manila Branch</option>
                        <option value="Makati">Makati Branch</option>
                        <option value="Imus">Imus Branch</option>
                    </select>
                    <i class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" aria-hidden="true"></i>
                </label>

                <label class="relative block">
                    <span class="sr-only">Filter by order activity</span>
                    <select class="min-h-11 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" data-customers-activity>
                        <option value="all">All Order Activity</option>
                        <option value="active">Has Active Orders</option>
                        <option value="completed">Completed Orders</option>
                        <option value="cancelled">Cancelled Orders</option>
                        <option value="none">No Orders</option>
                    </select>
                    <i class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" aria-hidden="true"></i>
                </label>

                <button type="button" class="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500" data-customers-clear>
                    <i class="fa-solid fa-rotate-left text-xs" aria-hidden="true"></i>
                    <span>Clear</span>
                </button>
            </div>
        </section>

        <section class="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-labelledby="customer-list-heading" aria-busy="true" data-customers-panel>
            <div class="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                    <h2 id="customer-list-heading" class="text-lg font-semibold text-[#0B1930]">Customer List</h2>
                    <p class="mt-1 text-sm text-slate-500"><span data-customers-panel-total>124</span> customer records</p>
                </div>

                <label class="relative block w-full sm:w-44">
                    <span class="sr-only">Sort customers</span>
                    <select class="min-h-10 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" data-customers-sort>
                        <option value="newest">Newest First</option>
                        <option value="name">Customer Name</option>
                    </select>
                    <i class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" aria-hidden="true"></i>
                </label>
            </div>

            <div role="status" aria-live="polite" data-customers-loading>
                <span class="sr-only">Loading customer records.</span>
                <div class="overflow-x-auto">
                    <table class="w-full min-w-[1250px] border-collapse text-left">
                        <thead class="bg-slate-50">@include('staff.customers.partials.table-head')</thead>
                        <tbody>
                            @for ($rowIndex = 0; $rowIndex < 8; $rowIndex++)
                                <x-skeleton type="table-row" :columns="9" />
                            @endfor
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="hidden" data-customers-content>
                <div class="overflow-x-auto">
                    <table class="w-full min-w-[1250px] border-collapse text-left">
                        <thead class="bg-slate-50">@include('staff.customers.partials.table-head')</thead>
                        <tbody class="divide-y divide-slate-100" data-customers-body></tbody>
                    </table>
                </div>

                <div class="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p class="text-sm text-slate-500">Showing <span class="font-semibold text-slate-700" data-customers-showing>1–8</span> of <span class="font-semibold text-slate-700" data-customers-total>124</span> customers</p>
                    <nav class="flex flex-wrap items-center gap-1" aria-label="Customers pagination">
                        <button type="button" class="min-h-9 cursor-not-allowed rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-400" disabled>Previous</button>
                        @for ($page = 1; $page <= 5; $page++)
                            <button type="button" @class(['inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500', 'bg-orange-500 text-white' => $page === 1, 'text-slate-600 hover:bg-slate-100' => $page !== 1]) @if ($page === 1) aria-current="page" @endif>{{ $page }}</button>
                        @endfor
                        <span class="px-1 text-slate-400">…</span>
                        <button type="button" class="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100">16</button>
                        <button type="button" class="min-h-9 cursor-pointer rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-600 transition hover:border-orange-300 hover:text-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">Next</button>
                    </nav>
                </div>
            </div>

            <div class="hidden px-6 py-16 text-center" data-customers-empty>
                <span class="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400" aria-hidden="true"><i class="fa-solid fa-users text-xl"></i></span>
                <h3 class="mt-4 font-semibold text-[#0B1930]">No customers found</h3>
                <p class="mt-1 text-sm text-slate-500">Try changing your search or filters.</p>
            </div>

            <div class="hidden px-6 py-16 text-center" role="alert" data-customers-error>
                <span class="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-red-50 text-red-500" aria-hidden="true"><i class="fa-solid fa-triangle-exclamation text-xl"></i></span>
                <h3 class="mt-4 font-semibold text-[#0B1930]">Unable to load customers</h3>
                <p class="mt-1 text-sm text-slate-500">Please try again.</p>
                <button type="button" class="mt-5 inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-orange-500 px-4 text-sm font-semibold text-orange-600 transition hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500" data-customers-retry>Retry</button>
            </div>
        </section>
    </div>
@endsection
