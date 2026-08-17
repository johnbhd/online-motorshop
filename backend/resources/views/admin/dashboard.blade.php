@extends('layouts.admin')

@section('title', 'Admin Dashboard | ALD Motorshop')

@php
    $summaryCards = [
        ['key' => 'total_orders', 'label' => 'Total Orders', 'description' => '8 pending review', 'icon' => 'fa-regular fa-clipboard', 'tone' => 'orange'],
        ['key' => 'payments_to_verify', 'label' => 'Payments to Verify', 'description' => 'Awaiting verification', 'icon' => 'fa-regular fa-credit-card', 'tone' => 'green'],
        ['key' => 'active_fulfillment', 'label' => 'Active Fulfillment', 'description' => '4 Pickup · 2 Delivery', 'icon' => 'fa-solid fa-store', 'tone' => 'blue'],
        ['key' => 'new_inquiries', 'label' => 'New Inquiries', 'description' => 'Website customer messages', 'icon' => 'fa-regular fa-message', 'tone' => 'orange'],
    ];

    $adminOrdersUrl = Illuminate\Support\Facades\Route::has('admin.orders.index')
        ? route('admin.orders.index')
        : '#';
    $adminBranchesUrl = Illuminate\Support\Facades\Route::has('admin.branches.index')
        ? route('admin.branches.index')
        : '#';
    $adminActivityUrl = Illuminate\Support\Facades\Route::has('admin.activity-logs.index')
        ? route('admin.activity-logs.index')
        : '#';
    $adminReportsUrl = Illuminate\Support\Facades\Route::has('admin.reports.index')
        ? route('admin.reports.index')
        : '#';
@endphp

@section('content')
    <div
        class="space-y-6"
        aria-busy="true"
        data-admin-dashboard
        data-admin-dashboard-endpoint="{{ route('admin.dashboard.data') }}"
    >
        <div
            class="hidden rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
            role="alert"
            data-admin-dashboard-error
        >
            <div
                class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
                <p>Unable to load dashboard. Please try again.</p>

                <button
                    type="button"
                    class="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    data-admin-dashboard-retry
                >
                    Retry
                </button>
            </div>
        </div>

        <section
            class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
            aria-labelledby="admin-dashboard-greeting"
        >
            <div>
                <h2
                    id="admin-dashboard-greeting"
                    class="text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl"
                >
                    Good evening, Admin User
                </h2>

                <p class="mt-2 text-sm text-slate-600 sm:text-base">
                    Here's a quick overview of ALD Motorshop operations today.
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

                    <span>August 8, 2026</span>
                </p>

                <a
                    href="{{ $adminReportsUrl }}"
                    class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                >
                    <i
                        class="fa-solid fa-chart-column"
                        aria-hidden="true"
                    ></i>

                    <span>View Reports</span>
                </a>
            </div>
        </section>

        <section aria-label="Admin summary">
            <div
                class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
                role="status"
                aria-live="polite"
                data-admin-dashboard-summary-loading
            >
                <span class="sr-only">Loading admin summary.</span>

                @for ($cardIndex = 0; $cardIndex < 4; $cardIndex++)
                    <x-skeleton type="stat" />
                @endfor
            </div>

            <div
                class="hidden grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
                data-admin-dashboard-summary-content
            >
                @foreach ($summaryCards as $card)
                    <article
                        class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                        <div class="flex items-start gap-4">
                            <span
                                @class([
                                    'inline-flex size-11 shrink-0 items-center justify-center rounded-lg',
                                    'bg-orange-50 text-orange-600' => $card['tone'] === 'orange',
                                    'bg-emerald-50 text-emerald-700' => $card['tone'] === 'green',
                                    'bg-blue-50 text-blue-700' => $card['tone'] === 'blue',
                                ])
                                aria-hidden="true"
                            >
                                <i class="{{ $card['icon'] }} text-lg"></i>
                            </span>

                            <div class="min-w-0">
                                <p
                                    class="text-3xl font-bold tracking-tight text-[#0B1930]"
                                    data-admin-dashboard-summary="{{ $card['key'] }}"
                                >
                                    —
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

        <div
            class="grid grid-cols-1 gap-6 xl:grid-cols-5"
            data-admin-dashboard-loading
        >
            <section
                class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-3"
                role="status"
                aria-live="polite"
            >
                <span class="sr-only">Loading recent orders.</span>

                <div class="border-b border-slate-200 px-5 py-5 sm:px-6">
                    <x-skeleton
                        type="text"
                        :lines="2"
                        class="max-w-sm"
                    />
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full min-w-[860px] border-collapse">
                        <tbody>
                            @for ($rowIndex = 0; $rowIndex < 5; $rowIndex++)
                                <x-skeleton
                                    type="table-row"
                                    :columns="7"
                                />
                            @endfor
                        </tbody>
                    </table>
                </div>
            </section>

            <div class="xl:col-span-2">
                <x-skeleton type="list" :rows="5" />
            </div>

            <div class="xl:col-span-3">
                <x-skeleton type="list" :rows="3" />
            </div>

            <div class="xl:col-span-2">
                <x-skeleton type="list" :rows="5" />
            </div>
        </div>

        <div
            class="hidden grid grid-cols-1 gap-6 xl:grid-cols-5"
            data-admin-dashboard-content
        >
            <section
                class="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-3"
                aria-labelledby="admin-recent-orders-heading"
            >
                <div
                    class="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                    <div>
                        <h2
                            id="admin-recent-orders-heading"
                            class="text-lg font-semibold text-[#0B1930]"
                        >
                            Recent Orders
                        </h2>

                        <p class="mt-1 text-sm text-slate-500">
                            Latest customer orders across ALD Motorshop.
                        </p>
                    </div>

                    <a
                        href="{{ $adminOrdersUrl }}"
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
                    <table class="w-full min-w-[860px] border-collapse text-left">
                        <thead class="bg-slate-50">
                            <tr class="border-b border-slate-200">
                                @foreach (['Order', 'Customer', 'Branch', 'Amount', 'Fulfillment', 'Status', 'Action'] as $column)
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
                            data-admin-dashboard-orders
                        ></tbody>
                    </table>
                </div>
            </section>

            <section
                class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-2"
                aria-labelledby="admin-attention-heading"
            >
                <div class="border-b border-slate-200 px-5 py-5 sm:px-6">
                    <h2
                        id="admin-attention-heading"
                        class="text-lg font-semibold text-[#0B1930]"
                    >
                        Needs Attention
                    </h2>

                    <p class="mt-1 text-sm text-slate-500">
                        Items that may require your review.
                    </p>
                </div>

                <div
                    class="divide-y divide-slate-100"
                    data-admin-dashboard-attention
                ></div>
            </section>

            <section
                class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-3"
                aria-labelledby="admin-branches-heading"
            >
                <div
                    class="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6"
                >
                    <div>
                        <h2
                            id="admin-branches-heading"
                            class="text-lg font-semibold text-[#0B1930]"
                        >
                            Branch Overview
                        </h2>

                        <p class="mt-1 text-sm text-slate-500">
                            Current order activity by branch.
                        </p>
                    </div>

                    <a
                        href="{{ $adminBranchesUrl }}"
                        class="shrink-0 text-sm font-semibold text-orange-600 transition hover:text-orange-700 focus:outline-none focus-visible:underline"
                    >
                        Manage Branches
                    </a>
                </div>

                <div
                    class="divide-y divide-slate-100"
                    data-admin-dashboard-branches
                ></div>
            </section>

            <section
                class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-2"
                aria-labelledby="admin-activity-heading"
            >
                <div
                    class="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6"
                >
                    <div>
                        <h2
                            id="admin-activity-heading"
                            class="text-lg font-semibold text-[#0B1930]"
                        >
                            Recent Activity
                        </h2>

                        <p class="mt-1 text-sm text-slate-500">
                            Latest important changes in the system.
                        </p>
                    </div>

                    <a
                        href="{{ $adminActivityUrl }}"
                        class="shrink-0 text-sm font-semibold text-orange-600 transition hover:text-orange-700 focus:outline-none focus-visible:underline"
                    >
                        View Activity Logs
                    </a>
                </div>

                <div
                    class="divide-y divide-slate-100"
                    data-admin-dashboard-activity
                ></div>
            </section>
        </div>
    </div>
@endsection
