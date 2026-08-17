@extends('layouts.admin')

@section('title', 'Admin Branches | ALD Motorshop')

@php
    $summaryCards = [
        [
            'key' => 'total_branches',
            'label' => 'Total Branches',
            'icon' => 'fa-solid fa-store',
            'tone' => 'blue',
        ],
        [
            'key' => 'pickup_available',
            'label' => 'Pickup Available',
            'icon' => 'fa-solid fa-bag-shopping',
            'tone' => 'green',
        ],
        [
            'key' => 'active_staff',
            'label' => 'Active Staff Assigned',
            'icon' => 'fa-solid fa-users',
            'tone' => 'orange',
        ],
    ];
@endphp

@section('content')
    <div
        class="space-y-5"
        aria-busy="true"
        data-admin-branches
        data-admin-branches-endpoint="{{ route('admin.branches.data') }}"
    >
        <div
            class="hidden rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
            role="alert"
            data-branch-error
        >
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p>Unable to load branches. Please try again.</p>

                <button
                    type="button"
                    class="inline-flex min-h-9 w-fit cursor-pointer items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-2 font-semibold transition hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    data-branch-retry
                >
                    Retry
                </button>
            </div>
        </div>

        <section
            class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"
            aria-labelledby="branches-page-heading"
        >
            <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
                    Branch Management
                </p>

                <h2
                    id="branches-page-heading"
                    class="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl"
                >
                    ALD Branches
                </h2>

                <p class="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
                    Manage branch locations, contact information, pickup availability, operating hours, and assigned staff.
                </p>
            </div>

            <button
                type="button"
                class="inline-flex min-h-11 w-fit cursor-pointer items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                data-add-branch
            >
                <i
                    class="fa-solid fa-plus"
                    aria-hidden="true"
                ></i>

                <span>Add Branch</span>
            </button>
        </section>

        <section aria-label="Branch summary">
            <div
                class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                data-branch-summary-loading
            >
                @for ($index = 0; $index < 3; $index++)
                    <x-skeleton type="stat" />
                @endfor
            </div>

            <div
                class="hidden grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                data-branch-summary-content
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
                                aria-hidden="true"
                            >
                                <i class="{{ $card['icon'] }} text-lg"></i>
                            </span>

                            <div>
                                <p
                                    class="text-3xl font-bold tracking-tight text-[#0B1930]"
                                    data-branch-summary="{{ $card['key'] }}"
                                >
                                    &mdash;
                                </p>

                                <h3 class="mt-1 text-sm font-medium text-slate-500">
                                    {{ $card['label'] }}
                                </h3>
                            </div>
                        </div>
                    </article>
                @endforeach
            </div>
        </section>

        <section
            class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            aria-label="Branch filters"
        >
            <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(16rem,1fr)_11rem_12rem_auto]">
                <label class="relative block">
                    <span class="sr-only">Search branches</span>

                    <i
                        class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400"
                        aria-hidden="true"
                    ></i>

                    <input
                        type="search"
                        class="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-[#0B1930] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        placeholder="Search branch name or location"
                        data-branch-search
                    >
                </label>

                <label class="relative block">
                    <span class="sr-only">Filter by branch status</span>

                    <select
                        class="min-h-11 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        data-branch-status
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

                <label class="relative block">
                    <span class="sr-only">Filter by pickup availability</span>

                    <select
                        class="min-h-11 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        data-branch-pickup
                    >
                        <option value="all">All Pickup Settings</option>
                        <option value="available">Pickup Available</option>
                        <option value="unavailable">Pickup Unavailable</option>
                    </select>

                    <i
                        class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                        aria-hidden="true"
                    ></i>
                </label>

                <button
                    type="button"
                    class="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-[#0B1930] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                    data-branch-clear
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
            class="space-y-4"
            aria-label="Branch list"
        >
            <div
                class="space-y-4"
                data-branch-loading
            >
                @for ($index = 0; $index < 3; $index++)
                    <x-skeleton
                        type="list"
                        :rows="3"
                    />
                @endfor
            </div>

            <div
                class="hidden space-y-4"
                data-branch-list
            ></div>

            <div
                class="hidden rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm"
                data-branch-empty
            >
                <span
                    class="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"
                    aria-hidden="true"
                >
                    <i class="fa-regular fa-building text-xl"></i>
                </span>

                <h3 class="mt-4 font-semibold text-[#0B1930]">
                    No branches found
                </h3>

                <p class="mt-1 text-sm text-slate-500">
                    Try changing your search or filters.
                </p>
            </div>
        </section>
    </div>
@endsection
