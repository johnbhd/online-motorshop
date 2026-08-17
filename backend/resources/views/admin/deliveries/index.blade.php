@extends('layouts.admin')

@section('title', 'Admin Delivery Requests | ALD Motorshop')

@php
    $summaryCards = [
        ['key' => 'active_deliveries', 'label' => 'Active Deliveries', 'icon' => 'fa-solid fa-truck-fast', 'tone' => 'blue'],
        ['key' => 'waiting_for_booking', 'label' => 'Waiting for Booking', 'icon' => 'fa-regular fa-clock', 'tone' => 'orange'],
        ['key' => 'delivered_today', 'label' => 'Delivered Today', 'icon' => 'fa-solid fa-circle-check', 'tone' => 'green'],
    ];

    $deliveryTabs = [
        ['key' => 'all', 'label' => 'All Delivery Requests', 'count' => 20],
        ['key' => 'Waiting for Booking', 'label' => 'Waiting for Booking', 'count' => 1],
        ['key' => 'Booked', 'label' => 'Booked', 'count' => 1],
        ['key' => 'Picked Up', 'label' => 'Picked Up', 'count' => 1],
        ['key' => 'In Transit', 'label' => 'In Transit', 'count' => 1],
        ['key' => 'Delivered', 'label' => 'Delivered', 'count' => 15],
        ['key' => 'Failed', 'label' => 'Failed', 'count' => 1],
        ['key' => 'Cancelled', 'label' => 'Cancelled', 'count' => 1],
    ];
@endphp

@section('content')
    <div
        class="space-y-5"
        aria-busy="true"
        data-admin-deliveries
        data-admin-deliveries-endpoint="{{ route('admin.deliveries.data') }}"
    >
        <div
            class="hidden rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
            role="alert"
            data-delivery-error
        >
            <div class="flex items-center justify-between gap-3">
                <span>Unable to load delivery requests. Please try again.</span>

                <button
                    type="button"
                    class="font-semibold hover:underline"
                    data-delivery-retry
                >
                    Retry
                </button>
            </div>
        </div>

        <section
            class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"
            aria-labelledby="delivery-page-heading"
        >
            <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
                    Delivery Management
                </p>

                <h2
                    id="delivery-page-heading"
                    class="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl"
                >
                    Lalamove Delivery Requests
                </h2>

                <p class="mt-2 text-sm text-slate-600 sm:text-base">
                    Manage Lalamove bookings, delivery fees, rider information, and delivery progress across ALD branches.
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
                    <strong data-delivery-active>2</strong> active delivery requests
                </span>
            </div>
        </section>

        <section aria-label="Delivery summary">
            <div
                class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
                data-delivery-summary-loading
            >
                @for ($index = 0; $index < 3; $index++)
                    <x-skeleton type="stat" />
                @endfor
            </div>

            <div
                class="hidden grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
                data-delivery-summary
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
                                    data-delivery-summary-value="{{ $card['key'] }}"
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
                    aria-label="Filter delivery requests by status"
                >
                    @foreach ($deliveryTabs as $tab)
                        <button
                            type="button"
                            @class([
                                'inline-flex min-h-14 cursor-pointer items-center gap-2 border-b-2 px-0.5 text-sm font-semibold transition',
                                'border-orange-500 text-[#0B1930]' => $tab['key'] === 'all',
                                'border-transparent text-slate-500 hover:text-[#0B1930]' => $tab['key'] !== 'all',
                            ])
                            data-delivery-tab="{{ $tab['key'] }}"
                        >
                            <span>{{ $tab['label'] }}</span>
                            <span class="inline-flex min-w-6 justify-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-600">
                                {{ $tab['count'] }}
                            </span>
                        </button>
                    @endforeach
                </div>
            </div>
        </section>

        <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(16rem,1fr)_10rem_13rem_11rem_auto]">
                <label class="relative block">
                    <span class="sr-only">Search delivery requests</span>
                    <i class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400"></i>
                    <input
                        type="search"
                        class="min-h-11 w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm"
                        placeholder="Search order reference or customer name"
                        data-delivery-search
                    >
                </label>

                @foreach ([
                    ['data-delivery-branch', ['All Branches' => 'all', 'Manila Branch' => 'Manila', 'Makati Branch' => 'Makati', 'Imus Branch' => 'Imus']],
                    ['data-delivery-status', ['All Delivery Statuses' => 'all', 'Waiting for Booking' => 'Waiting for Booking', 'Booked' => 'Booked', 'Picked Up' => 'Picked Up', 'In Transit' => 'In Transit', 'Delivered' => 'Delivered', 'Failed' => 'Failed', 'Cancelled' => 'Cancelled']],
                    ['data-delivery-staff', ['All Staff' => 'all', 'Staff User' => 'Staff User', 'Anna Staff' => 'Anna Staff', 'Mark Staff' => 'Mark Staff', 'Unassigned' => '—']],
                ] as [$attribute, $options])
                    <label class="relative block">
                        <span class="sr-only">Filter delivery requests</span>
                        <select
                            class="min-h-11 w-full appearance-none rounded-lg border border-slate-300 px-3.5 py-2.5 pr-9 text-sm"
                            {{ $attribute }}
                        >
                            @foreach ($options as $label => $value)
                                <option value="{{ $value }}">{{ $label }}</option>
                            @endforeach
                        </select>
                        <i class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
                    </label>
                @endforeach

                <button type="button" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-500 hover:bg-slate-100" data-delivery-clear>
                    <i class="fa-solid fa-rotate-left text-xs"></i>
                    Clear
                </button>
            </div>
        </section>

        <section class="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" data-delivery-panel>
            <div class="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                    <h2 class="text-lg font-semibold text-[#0B1930]">Delivery Requests</h2>
                    <p class="mt-1 text-sm text-slate-500"><span data-delivery-total-label>20</span> Lalamove delivery orders</p>
                </div>
                <span class="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700">Newest First</span>
            </div>

            <div data-delivery-loading>
                <div class="overflow-x-auto"><table class="w-full min-w-[1180px]"><tbody>@for ($index = 0; $index < 8; $index++)<x-skeleton type="table-row" :columns="9" />@endfor</tbody></table></div>
            </div>

            <div class="hidden" data-delivery-content>
                <div class="overflow-x-auto">
                    <table class="w-full min-w-[1180px] text-left"><thead class="bg-slate-50"><tr>@foreach (['Order', 'Customer', 'Destination', 'Dispatch Branch', 'Amount', 'Delivery Fee', 'Assigned Staff', 'Delivery Status', 'Action'] as $head)<th class="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{{ $head }}</th>@endforeach</tr></thead><tbody class="divide-y divide-slate-100" data-delivery-body></tbody></table>
                </div>
                <div class="border-t border-slate-200 px-5 py-4 text-sm text-slate-500">Showing <span data-delivery-showing>1–8</span> of <span data-delivery-total>20</span> delivery requests</div>
            </div>

            <div class="hidden px-6 py-16 text-center" data-delivery-empty>
                <h3 class="font-semibold text-[#0B1930]">No delivery requests found</h3>
                <p class="mt-1 text-sm text-slate-500">Try changing your search or filters.</p>
            </div>
        </section>

        <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div class="border-b border-slate-200 px-5 py-5"><h2 class="text-lg font-semibold text-[#0B1930]">Delivery by Branch</h2></div>
            <div class="p-5" data-delivery-branches-loading><x-skeleton type="list" :rows="3" /></div>
            <div class="hidden overflow-x-auto" data-delivery-branches-content><table class="w-full min-w-[640px] text-left"><thead class="bg-slate-50"><tr>@foreach (['Branch', 'Delivery Requests', 'Active', 'Delivered'] as $head)<th class="px-5 py-3 text-xs font-semibold uppercase text-slate-500">{{ $head }}</th>@endforeach</tr></thead><tbody class="divide-y divide-slate-100" data-delivery-branches></tbody></table></div>
        </section>
    </div>
@endsection
