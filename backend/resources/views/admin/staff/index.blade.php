@extends('layouts.admin')

@section('title', 'Admin Staff Management | ALD Motorshop')

@php
    $summaryMetrics = [
        [
            'key' => 'total',
            'label' => 'Total Staff',
            'icon' => 'fa-solid fa-users',
            'tone' => 'blue',
        ],
        [
            'key' => 'active',
            'label' => 'Active Staff',
            'icon' => 'fa-solid fa-user-check',
            'tone' => 'green',
        ],
        [
            'key' => 'inactive',
            'label' => 'Inactive Staff',
            'icon' => 'fa-solid fa-user-xmark',
            'tone' => 'red',
        ],
    ];

    $staffTabs = [
        ['key' => 'all', 'label' => 'All Staff', 'summaryKey' => 'total'],
        ['key' => 'Active', 'label' => 'Active', 'summaryKey' => 'active'],
        ['key' => 'Inactive', 'label' => 'Inactive', 'summaryKey' => 'inactive'],
    ];

    $tableColumns = [
        'Staff',
        'Email',
        'Role',
        'Branch',
        'Status',
        'Last Active',
        'Action',
    ];
@endphp

@section('content')
    <div
        class="space-y-5"
        aria-busy="true"
        data-admin-staff
        data-admin-staff-endpoint="{{ route('admin.staff.data') }}"
    >
        <div
            class="hidden rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
            role="alert"
            data-staff-error
        >
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p>Unable to load staff accounts. Please try again.</p>

                <button
                    type="button"
                    class="inline-flex min-h-9 w-fit cursor-pointer items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-2 font-semibold transition hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    data-staff-retry
                >
                    Retry
                </button>
            </div>
        </div>

        <section
            class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"
            aria-labelledby="staff-page-heading"
        >
            <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
                    Staff Accounts
                </p>

                <h2
                    id="staff-page-heading"
                    class="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl"
                >
                    Manage Staff
                </h2>

                <p class="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
                    Create staff accounts, assign roles and branches, and monitor account status.
                </p>
            </div>

            <button
                type="button"
                class="inline-flex min-h-11 w-fit cursor-pointer items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                data-add-staff
            >
                <i
                    class="fa-solid fa-user-plus"
                    aria-hidden="true"
                ></i>

                <span>Add Staff Account</span>
            </button>
        </section>

        <section aria-label="Staff summary">
            <div
                class="grid grid-cols-1 gap-4 sm:grid-cols-3"
                data-staff-summary-loading
            >
                @for ($index = 0; $index < 3; $index++)
                    <x-skeleton type="stat" />
                @endfor
            </div>

            <div
                class="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:grid sm:grid-cols-3 sm:divide-x sm:divide-slate-200"
                data-staff-summary-content
            >
                @foreach ($summaryMetrics as $metric)
                    <article class="flex items-center gap-4 p-5">
                        <span
                            @class([
                                'inline-flex size-11 shrink-0 items-center justify-center rounded-lg',
                                'bg-blue-50 text-blue-700' => $metric['tone'] === 'blue',
                                'bg-emerald-50 text-emerald-700' => $metric['tone'] === 'green',
                                'bg-red-50 text-red-600' => $metric['tone'] === 'red',
                            ])
                            aria-hidden="true"
                        >
                            <i class="{{ $metric['icon'] }} text-lg"></i>
                        </span>

                        <div>
                            <p
                                class="text-3xl font-bold tracking-tight text-[#0B1930]"
                                data-staff-summary="{{ $metric['key'] }}"
                            >
                                &mdash;
                            </p>

                            <h3 class="mt-1 text-sm font-medium text-slate-500">
                                {{ $metric['label'] }}
                            </h3>
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
                    aria-label="Filter staff by status"
                >
                    @foreach ($staffTabs as $tab)
                        <button
                            type="button"
                            @class([
                                'inline-flex min-h-14 cursor-pointer items-center gap-2 border-b-2 px-0.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500',
                                'border-orange-500 text-[#0B1930]' => $tab['key'] === 'all',
                                'border-transparent text-slate-500 hover:text-[#0B1930]' => $tab['key'] !== 'all',
                            ])
                            role="tab"
                            aria-selected="{{ $tab['key'] === 'all' ? 'true' : 'false' }}"
                            data-staff-tab="{{ $tab['key'] }}"
                        >
                            <span>{{ $tab['label'] }}</span>

                            <span
                                class="inline-flex min-w-6 justify-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-600"
                                data-staff-tab-count="{{ $tab['summaryKey'] }}"
                            >
                                &mdash;
                            </span>
                        </button>
                    @endforeach
                </div>
            </div>
        </section>

        <section
            class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            aria-label="Staff filters"
        >
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(15rem,1fr)_11rem_13rem_11rem_auto]">
                <label class="relative block">
                    <span class="sr-only">Search staff</span>

                    <i
                        class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400"
                        aria-hidden="true"
                    ></i>

                    <input
                        type="search"
                        class="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-[#0B1930] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        placeholder="Search staff name or email"
                        data-staff-search
                    >
                </label>

                <label class="relative block">
                    <span class="sr-only">Filter by branch</span>

                    <select
                        class="min-h-11 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        data-staff-branch
                    >
                        <option value="all">All Branches</option>
                        <option value="Manila Branch">Manila Branch</option>
                        <option value="Makati Branch">Makati Branch</option>
                        <option value="Imus Branch">Imus Branch</option>
                    </select>

                    <i
                        class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                        aria-hidden="true"
                    ></i>
                </label>

                <label class="relative block">
                    <span class="sr-only">Filter by staff role</span>

                    <select
                        class="min-h-11 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        data-staff-role
                    >
                        <option value="all">All Roles</option>
                        <option value="Order Processing Staff">Order Processing Staff</option>
                        <option value="Branch Staff">Branch Staff</option>
                    </select>

                    <i
                        class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                        aria-hidden="true"
                    ></i>
                </label>

                <label class="relative block">
                    <span class="sr-only">Filter by account status</span>

                    <select
                        class="min-h-11 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        data-staff-status
                    >
                        <option value="all">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>

                    <i
                        class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                        aria-hidden="true"
                    ></i>
                </label>

                <button
                    type="button"
                    class="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-[#0B1930] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                    data-staff-clear
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
                        Staff Accounts
                    </h2>

                    <p class="mt-1 text-sm text-slate-500">
                        <span data-staff-total-label>9</span> staff accounts
                    </p>
                </div>

                <label class="relative block">
                    <span class="sr-only">Sort staff accounts</span>

                    <select
                        class="min-h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 sm:w-40"
                        data-staff-sort
                    >
                        <option value="name-asc">Name A&ndash;Z</option>
                        <option value="name-desc">Name Z&ndash;A</option>
                    </select>

                    <i
                        class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                        aria-hidden="true"
                    ></i>
                </label>
            </div>

            <div data-staff-loading>
                <div class="overflow-x-auto">
                    <table class="w-full min-w-[980px]">
                        <tbody>
                            @for ($index = 0; $index < 8; $index++)
                                <x-skeleton type="table-row" :columns="7" />
                            @endfor
                        </tbody>
                    </table>
                </div>
            </div>

            <div
                class="hidden"
                data-staff-content
            >
                <div class="overflow-x-auto">
                    <table class="w-full min-w-[980px] text-left">
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
                            data-staff-body
                        ></tbody>
                    </table>
                </div>

                <div class="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p class="text-sm text-slate-500">
                        Showing <span data-staff-showing>1&ndash;8</span> of <span data-staff-total>9</span> staff accounts
                    </p>

                    <nav
                        class="flex items-center gap-1 text-sm font-medium"
                        aria-label="Staff accounts pagination"
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

                        <button
                            type="button"
                            class="inline-flex size-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100"
                        >
                            2
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
                data-staff-empty
            >
                <span
                    class="inline-flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"
                    aria-hidden="true"
                >
                    <i class="fa-solid fa-users text-lg"></i>
                </span>

                <h3 class="mt-4 font-semibold text-[#0B1930]">
                    No staff accounts found
                </h3>

                <p class="mt-1 text-sm text-slate-500">
                    Try changing your search or filters.
                </p>
            </div>
        </section>
    </div>
@endsection
