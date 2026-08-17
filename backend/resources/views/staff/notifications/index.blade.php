@extends('layouts.staff')

@section('title', 'Staff Notifications | ALD Motorshop')
@section('header-title', 'Notifications')

@php
    $notificationTabs = [
        ['key' => 'all', 'label' => 'All Notifications', 'countKey' => 'total', 'count' => 18],
        ['key' => 'unread', 'label' => 'Unread', 'countKey' => 'unread', 'count' => 8],
        ['key' => 'read', 'label' => 'Read', 'countKey' => 'read', 'count' => 10],
    ];
@endphp

@section('content')
    <div
        class="space-y-5"
        data-staff-notifications
        data-notifications-endpoint="{{ route('staff.notifications.data') }}"
    >
        <section
            class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"
            aria-labelledby="notifications-page-heading"
        >
            <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
                    Notification Center
                </p>

                <h2
                    id="notifications-page-heading"
                    class="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl"
                >
                    Notifications
                </h2>

                <p class="mt-2 text-sm text-slate-600 sm:text-base">
                    View recent Staff alerts and activity that may require your attention.
                </p>
            </div>

            <div
                class="inline-flex min-h-11 w-fit items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-800"
            >
                <span
                    class="inline-flex size-8 items-center justify-center rounded-lg bg-white text-orange-600 shadow-sm"
                    aria-hidden="true"
                >
                    <i class="fa-regular fa-bell"></i>
                </span>

                <span>
                    <strong data-notifications-header-unread>8</strong> unread notifications
                </span>
            </div>
        </section>

        <section
            class="rounded-xl border border-slate-200 bg-white px-4 shadow-sm sm:px-5"
            aria-label="Notification status navigation"
        >
            <div class="overflow-x-auto">
                <div
                    class="flex min-w-max items-center gap-6"
                    role="tablist"
                    aria-label="Filter notifications by read status"
                >
                    @foreach ($notificationTabs as $tab)
                        <button
                            type="button"
                            @class([
                                'inline-flex min-h-14 cursor-pointer items-center gap-2 border-b-2 px-0.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
                                'border-orange-500 text-[#0B1930]' => $tab['key'] === 'all',
                                'border-transparent text-slate-500 hover:text-[#0B1930]' => $tab['key'] !== 'all',
                            ])
                            role="tab"
                            aria-selected="{{ $tab['key'] === 'all' ? 'true' : 'false' }}"
                            data-notifications-tab="{{ $tab['key'] }}"
                        >
                            <span>{{ $tab['label'] }}</span>

                            <span
                                class="inline-flex min-w-6 items-center justify-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-600"
                                data-notifications-tab-count="{{ $tab['countKey'] }}"
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
            aria-label="Notification filters"
        >
            <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
                <label class="relative block min-w-0 flex-1">
                    <span class="sr-only">Search notifications</span>
                    <i
                        class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400"
                        aria-hidden="true"
                    ></i>
                    <input
                        type="search"
                        class="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-[#0B1930] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        placeholder="Search notifications"
                        data-notifications-search
                    >
                </label>

                <label class="relative block w-full lg:w-44">
                    <span class="sr-only">Filter by notification type</span>
                    <select
                        class="min-h-11 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        data-notifications-type
                    >
                        <option value="all">All Types</option>
                        <option value="Orders">Orders</option>
                        <option value="Payments">Payments</option>
                        <option value="Pickup">Pickup</option>
                        <option value="Delivery">Delivery</option>
                        <option value="Messages">Messages</option>
                        <option value="Reviews">Reviews</option>
                        <option value="Product">Product</option>
                        <option value="System">System</option>
                    </select>
                    <i
                        class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                        aria-hidden="true"
                    ></i>
                </label>

                <button
                    type="button"
                    class="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-orange-600 transition hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                    data-notifications-mark-all
                >
                    <i
                        class="fa-solid fa-check-double text-sm"
                        aria-hidden="true"
                    ></i>

                    <span>Mark All as Read</span>
                </button>
            </div>
        </section>

        <section
            class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            aria-labelledby="recent-notifications-heading"
            aria-busy="true"
            data-notifications-panel
        >
            <div class="border-b border-slate-200 px-5 py-5 sm:px-6">
                <h2
                    id="recent-notifications-heading"
                    class="text-lg font-semibold text-[#0B1930]"
                >
                    Recent Notifications
                </h2>
            </div>

            <div
                class="p-5 sm:p-6"
                role="status"
                aria-live="polite"
                data-notifications-loading
            >
                <span class="sr-only">Loading notifications.</span>
                <x-skeleton type="list" :rows="6" />
            </div>

            <div
                class="hidden divide-y divide-slate-100"
                data-notifications-content
            ></div>

            <div
                class="hidden px-6 py-16 text-center"
                data-notifications-empty
            >
                <span
                    class="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"
                    aria-hidden="true"
                >
                    <i class="fa-regular fa-bell text-xl"></i>
                </span>

                <h3
                    class="mt-4 font-semibold text-[#0B1930]"
                    data-notifications-empty-title
                >
                    No notifications
                </h3>

                <p
                    class="mt-1 text-sm text-slate-500"
                    data-notifications-empty-description
                >
                    You're all caught up.
                </p>
            </div>

            <div
                class="hidden px-6 py-16 text-center"
                role="alert"
                data-notifications-error
            >
                <span
                    class="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-red-50 text-red-500"
                    aria-hidden="true"
                >
                    <i class="fa-solid fa-triangle-exclamation text-xl"></i>
                </span>

                <h3 class="mt-4 font-semibold text-[#0B1930]">
                    Unable to load notifications
                </h3>

                <p class="mt-1 text-sm text-slate-500">
                    Please try again.
                </p>

                <button
                    type="button"
                    class="mt-5 inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-orange-500 px-4 text-sm font-semibold text-orange-600 transition hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                    data-notifications-retry
                >
                    Retry
                </button>
            </div>
        </section>
    </div>
@endsection
