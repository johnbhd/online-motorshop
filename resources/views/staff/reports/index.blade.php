@extends('layouts.staff')

@section('title', 'Staff Reports | ALD Motorshop')
@section('header-title', 'Reports')

@php
    $summaryCards = [
        ['key' => 'total_sales', 'label' => 'Total Sales', 'support' => 'total_sales_change', 'icon' => 'fa-solid fa-peso-sign', 'tone' => 'orange', 'sparkline' => 'sales'],
        ['key' => 'total_orders', 'label' => 'Total Orders', 'support' => 'total_orders_change', 'icon' => 'fa-solid fa-bag-shopping', 'tone' => 'orange', 'sparkline' => 'orders'],
        ['key' => 'total_customers', 'label' => 'Total Customers', 'support' => 'total_customers_change', 'icon' => 'fa-solid fa-users', 'tone' => 'green', 'sparkline' => 'customers'],
        ['key' => 'average_order_value', 'label' => 'Average Order Value', 'support' => 'average_order_value_change', 'icon' => 'fa-solid fa-arrow-trend-up', 'tone' => 'blue', 'sparkline' => 'average'],
        ['key' => 'completed_orders', 'label' => 'Completed Orders', 'support' => 'completion_rate', 'icon' => 'fa-solid fa-circle-check', 'tone' => 'green', 'sparkline' => 'completed'],
    ];

    $charts = [
        ['key' => 'sales-over-time', 'title' => 'Sales Over Time'],
        ['key' => 'orders-by-status', 'title' => 'Orders by Status'],
        ['key' => 'sales-by-branch', 'title' => 'Sales by Branch'],
        ['key' => 'top-products', 'title' => 'Top Products by Sales'],
        ['key' => 'customer-breakdown', 'title' => 'Customer Breakdown'],
        ['key' => 'sales-vs-orders', 'title' => 'Sales vs Orders'],
    ];
@endphp

@section('content')
    <div
        class="space-y-5"
        data-staff-reports
        data-reports-endpoint="{{ route('staff.reports.data') }}"
    >
        <section class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between" aria-labelledby="reports-page-heading">
            <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">Business Analytics</p>
                <h2 id="reports-page-heading" class="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl">Reports &amp; Analytics</h2>
                <p class="mt-2 text-sm text-slate-600 sm:text-base">Monitor sales, orders, customers, products, and overall store performance.</p>
            </div>

            <label class="relative block w-full sm:w-48">
                <span class="sr-only">Reporting period</span>
                <i class="fa-regular fa-calendar pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-orange-600" aria-hidden="true"></i>
                <select class="min-h-11 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-9 text-sm font-semibold text-[#0B1930] outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" data-reports-period>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month" selected>This Month</option>
                    <option value="last-30-days">Last 30 Days</option>
                    <option value="last-3-months">Last 3 Months</option>
                    <option value="year">This Year</option>
                </select>
                <i class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" aria-hidden="true"></i>
            </label>
        </section>

        <div class="hidden rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700" role="alert" data-reports-error>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p>Unable to load reports. Please try again.</p>
                <button type="button" class="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500" data-reports-retry>Retry</button>
            </div>
        </div>

        <section aria-label="Report summary">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" role="status" aria-live="polite" data-reports-summary-loading>
                <span class="sr-only">Loading report summary.</span>
                @for ($cardIndex = 0; $cardIndex < 5; $cardIndex++)
                    <x-skeleton type="stat" />
                @endfor
            </div>

            <div class="hidden grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" data-reports-summary-content>
                @foreach ($summaryCards as $card)
                    <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <p class="text-[11px] font-bold uppercase tracking-wide text-slate-500">{{ $card['label'] }}</p>
                                <p class="mt-2 text-2xl font-bold tracking-tight text-[#0B1930]" data-report-summary="{{ $card['key'] }}">—</p>
                            </div>
                            <span @class([
                                'inline-flex size-9 items-center justify-center rounded-lg',
                                'bg-orange-50 text-orange-600' => $card['tone'] === 'orange',
                                'bg-blue-50 text-blue-700' => $card['tone'] === 'blue',
                                'bg-emerald-50 text-emerald-700' => $card['tone'] === 'green',
                            ]) aria-hidden="true"><i class="{{ $card['icon'] }} text-sm"></i></span>
                        </div>
                        <p class="mt-2 text-xs text-slate-500"><span class="font-semibold text-emerald-700" data-report-support="{{ $card['support'] }}">—</span> <span data-report-support-label="{{ $card['support'] }}">vs previous period</span></p>
                        <div class="mt-3 h-10"><canvas data-report-sparkline="{{ $card['sparkline'] }}"></canvas></div>
                    </article>
                @endforeach
            </div>
        </section>

        <section class="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3" aria-label="Report charts" data-reports-charts>
            @foreach ($charts as $chart)
                <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" data-report-chart-card="{{ $chart['key'] }}">
                    <h2 class="text-base font-semibold text-[#0B1930]">{{ $chart['title'] }}</h2>
                    <div class="mt-4 h-64" data-report-chart-loading="{{ $chart['key'] }}"><x-skeleton type="text" :lines="5" class="pt-8" /></div>
                    <div class="hidden mt-4 h-64" data-report-chart-content="{{ $chart['key'] }}"><canvas data-report-chart="{{ $chart['key'] }}"></canvas></div>
                    <p class="hidden mt-4 text-sm text-slate-500" data-report-chart-empty="{{ $chart['key'] }}">No report data available for this period.</p>
                </article>
            @endforeach
        </section>

        <section class="grid grid-cols-1 gap-5 md:grid-cols-3" aria-label="Report insights">
            @foreach ([
                ['key' => 'most_ordered_product', 'title' => 'Most Ordered Product', 'icon' => 'fa-solid fa-trophy', 'tone' => 'orange'],
                ['key' => 'top_customer', 'title' => 'Top Customer', 'icon' => 'fa-solid fa-user', 'tone' => 'blue'],
                ['key' => 'most_used_fulfillment', 'title' => 'Most Used Fulfillment', 'icon' => 'fa-solid fa-store', 'tone' => 'orange'],
            ] as $insight)
                <article class="hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm" data-report-insight="{{ $insight['key'] }}">
                    <div class="flex items-start gap-3">
                        <span @class(['inline-flex size-10 shrink-0 items-center justify-center rounded-lg', 'bg-orange-50 text-orange-600' => $insight['tone'] === 'orange', 'bg-blue-50 text-blue-700' => $insight['tone'] === 'blue']) aria-hidden="true"><i class="{{ $insight['icon'] }}"></i></span>
                        <div class="min-w-0"><p class="text-sm font-semibold text-slate-500">{{ $insight['title'] }}</p><h2 class="mt-1 truncate font-semibold text-[#0B1930]" data-report-insight-value="{{ $insight['key'] }}">—</h2><p class="mt-1 text-sm text-slate-500" data-report-insight-support="{{ $insight['key'] }}">—</p></div>
                    </div>
                </article>
            @endforeach
        </section>
    </div>
@endsection
