@extends('layouts.staff')

@section('title', 'Staff Reviews | ALD Motorshop')
@section('header-title', 'Reviews')

@php
    $summaryCards = [
        ['key' => 'total', 'label' => 'Total Reviews', 'description' => 'All customer reviews', 'icon' => 'fa-regular fa-star', 'tone' => 'orange'],
        ['key' => 'average_rating', 'label' => 'Average Rating', 'description' => 'Out of 5 stars', 'icon' => 'fa-solid fa-star', 'tone' => 'orange'],
        ['key' => 'awaiting_reply', 'label' => 'Awaiting Reply', 'description' => 'Need Staff response', 'icon' => 'fa-regular fa-comment-dots', 'tone' => 'blue'],
        ['key' => 'needs_admin_review', 'label' => 'Needs Admin Review', 'description' => 'Flagged or inappropriate', 'icon' => 'fa-solid fa-flag', 'tone' => 'orange'],
    ];

    $reviewTabs = [
        ['key' => 'all', 'label' => 'All Reviews', 'countKey' => 'total', 'count' => 86],
        ['key' => 'published', 'label' => 'Published', 'countKey' => 'published', 'count' => 68],
        ['key' => 'pending_review', 'label' => 'Pending Review', 'countKey' => 'pending_review', 'count' => 8],
        ['key' => 'flagged', 'label' => 'Flagged', 'countKey' => 'flagged', 'count' => 3],
        ['key' => 'hidden', 'label' => 'Hidden', 'countKey' => 'hidden', 'count' => 7],
    ];
@endphp

@section('content')
    <div
        class="space-y-5"
        data-staff-reviews
        data-reviews-endpoint="{{ route('staff.reviews.data') }}"
    >
        <section
            class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"
            aria-labelledby="reviews-page-heading"
        >
            <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
                    Review Monitoring
                </p>

                <h2
                    id="reviews-page-heading"
                    class="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl"
                >
                    Customer Reviews
                </h2>

                <p class="mt-2 text-sm text-slate-600 sm:text-base">
                    Monitor customer feedback, respond to reviews, and flag reviews that need Admin attention.
                </p>
            </div>

            <div
                class="inline-flex min-h-11 w-fit items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-800"
            >
                <span
                    class="inline-flex size-8 items-center justify-center rounded-lg bg-white text-orange-600 shadow-sm"
                    aria-hidden="true"
                >
                    <i class="fa-solid fa-flag"></i>
                </span>

                <span>
                    <strong data-reviews-attention-count>3</strong> reviews need attention
                </span>
            </div>
        </section>

        <section aria-label="Review summary">
            <div
                class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
                role="status"
                aria-live="polite"
                data-reviews-summary-loading
            >
                <span class="sr-only">Loading review summary.</span>
                @for ($cardIndex = 0; $cardIndex < 4; $cardIndex++)
                    <x-skeleton type="stat" />
                @endfor
            </div>

            <div class="hidden grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" data-reviews-summary-content>
                @foreach ($summaryCards as $card)
                    <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div class="flex items-start gap-4">
                            <span @class([
                                'inline-flex size-11 shrink-0 items-center justify-center rounded-lg',
                                'bg-orange-50 text-orange-600' => $card['tone'] === 'orange',
                                'bg-blue-50 text-blue-700' => $card['tone'] === 'blue',
                            ]) aria-hidden="true">
                                <i class="{{ $card['icon'] }} text-lg"></i>
                            </span>

                            <div class="min-w-0">
                                <p class="text-3xl font-bold tracking-tight text-[#0B1930]" data-reviews-summary="{{ $card['key'] }}">—</p>
                                <h3 class="mt-1 font-semibold text-[#0B1930]">{{ $card['label'] }}</h3>
                                <p class="mt-1 text-sm text-slate-500">{{ $card['description'] }}</p>
                            </div>
                        </div>
                    </article>
                @endforeach
            </div>
        </section>

        <section
            class="rounded-xl border border-slate-200 bg-white px-4 shadow-sm sm:px-5"
            aria-label="Review status navigation"
        >
            <div class="overflow-x-auto">
                <div
                    class="flex min-w-max items-center gap-6"
                    role="tablist"
                    aria-label="Filter reviews by status"
                >
                    @foreach ($reviewTabs as $tab)
                        <button
                            type="button"
                            @class([
                                'inline-flex min-h-14 cursor-pointer items-center gap-2 border-b-2 px-0.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
                                'border-orange-500 text-[#0B1930]' => $tab['key'] === 'all',
                                'border-transparent text-slate-500 hover:text-[#0B1930]' => $tab['key'] !== 'all',
                            ])
                            role="tab"
                            aria-selected="{{ $tab['key'] === 'all' ? 'true' : 'false' }}"
                            data-reviews-tab="{{ $tab['key'] }}"
                        >
                            <span>{{ $tab['label'] }}</span>
                            <span class="inline-flex min-w-6 items-center justify-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-600" data-reviews-tab-count="{{ $tab['countKey'] }}">{{ $tab['count'] }}</span>
                        </button>
                    @endforeach
                </div>
            </div>
        </section>

        <section
            class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            aria-label="Review filters"
        >
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(17rem,1fr)_9rem_13rem_10rem_10rem_auto]">
                <label class="relative block">
                    <span class="sr-only">Search reviews</span>
                    <i class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" aria-hidden="true"></i>
                    <input type="search" class="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-[#0B1930] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100" placeholder="Search customer, product, review, or order reference" data-reviews-search>
                </label>

                <label class="relative block">
                    <span class="sr-only">Filter by rating</span>
                    <select class="min-h-11 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" data-reviews-rating>
                        <option value="all">All Ratings</option>
                        @for ($rating = 5; $rating >= 1; $rating--)
                            <option value="{{ $rating }}">{{ $rating }} Star{{ $rating > 1 ? 's' : '' }}</option>
                        @endfor
                    </select>
                    <i class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" aria-hidden="true"></i>
                </label>

                <label class="relative block">
                    <span class="sr-only">Filter by product</span>
                    <select class="min-h-11 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" data-reviews-product>
                        <option value="all">All Products</option>
                        @foreach (['Genuine Honda Brake Pad Set', 'Yamaha Motorcycle Battery', 'Motorcycle Tire 70/90-17', 'Suzuki Air Filter', 'Premium 4T Motorcycle Engine Oil', 'Front Brake Disc Rotor', 'Motorcycle Spark Plug', 'Honda Drive Belt'] as $product)
                            <option value="{{ $product }}">{{ $product }}</option>
                        @endforeach
                    </select>
                    <i class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" aria-hidden="true"></i>
                </label>

                <label class="relative block">
                    <span class="sr-only">Filter by branch</span>
                    <select class="min-h-11 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" data-reviews-branch>
                        <option value="all">All Branches</option>
                        <option value="Manila">Manila Branch</option>
                        <option value="Makati">Makati Branch</option>
                        <option value="Imus">Imus Branch</option>
                    </select>
                    <i class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" aria-hidden="true"></i>
                </label>

                <label class="relative block">
                    <span class="sr-only">Filter by date</span>
                    <select class="min-h-11 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" data-reviews-date>
                        <option value="all">All Dates</option>
                        <option value="2026-08-12">Aug 12, 2026</option>
                        <option value="2026-08-11">Aug 11, 2026</option>
                        <option value="2026-08-10">Aug 10, 2026</option>
                        <option value="2026-08-09">Aug 9, 2026</option>
                        <option value="2026-08-08">Aug 8, 2026</option>
                        <option value="2026-08-07">Aug 7, 2026</option>
                    </select>
                    <i class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" aria-hidden="true"></i>
                </label>

                <button type="button" class="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500" data-reviews-clear>
                    <i class="fa-solid fa-rotate-left text-xs" aria-hidden="true"></i>
                    <span>Clear</span>
                </button>
            </div>
        </section>

        <section class="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-labelledby="review-list-heading" aria-busy="true" data-reviews-panel>
            <div class="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                    <h2 id="review-list-heading" class="text-lg font-semibold text-[#0B1930]">Review List</h2>
                    <p class="mt-1 text-sm text-slate-500"><span data-reviews-panel-total>86</span> customer reviews</p>
                </div>

                <label class="relative block w-full sm:w-44">
                    <span class="sr-only">Sort reviews</span>
                    <select class="min-h-10 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" data-reviews-sort>
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                    </select>
                    <i class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" aria-hidden="true"></i>
                </label>
            </div>

            <div role="status" aria-live="polite" data-reviews-loading>
                <span class="sr-only">Loading reviews.</span>
                <div class="overflow-x-auto">
                    <table class="w-full min-w-[1200px] border-collapse text-left">
                        <thead class="bg-slate-50">@include('staff.reviews.partials.table-head')</thead>
                        <tbody>
                            @for ($rowIndex = 0; $rowIndex < 8; $rowIndex++)
                                <x-skeleton type="table-row" :columns="8" />
                            @endfor
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="hidden" data-reviews-content>
                <div class="overflow-x-auto">
                    <table class="w-full min-w-[1200px] border-collapse text-left">
                        <thead class="bg-slate-50">@include('staff.reviews.partials.table-head')</thead>
                        <tbody class="divide-y divide-slate-100" data-reviews-body></tbody>
                    </table>
                </div>

                <div class="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p class="text-sm text-slate-500">Showing <span class="font-semibold text-slate-700" data-reviews-showing>1–8</span> of <span class="font-semibold text-slate-700" data-reviews-total>86</span> reviews</p>
                    <nav class="flex flex-wrap items-center gap-1" aria-label="Reviews pagination">
                        <button type="button" class="min-h-9 cursor-not-allowed rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-400" disabled>Previous</button>
                        @for ($page = 1; $page <= 5; $page++)
                            <button type="button" @class(['inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500', 'bg-orange-500 text-white' => $page === 1, 'text-slate-600 hover:bg-slate-100' => $page !== 1]) @if ($page === 1) aria-current="page" @endif>{{ $page }}</button>
                        @endfor
                        <span class="px-1 text-slate-400">…</span>
                        <button type="button" class="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100">11</button>
                        <button type="button" class="min-h-9 cursor-pointer rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-600 transition hover:border-orange-300 hover:text-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">Next</button>
                    </nav>
                </div>
            </div>

            <div class="hidden px-6 py-16 text-center" data-reviews-empty>
                <span class="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400" aria-hidden="true"><i class="fa-regular fa-star text-xl"></i></span>
                <h3 class="mt-4 font-semibold text-[#0B1930]">No reviews found</h3>
                <p class="mt-1 text-sm text-slate-500">Try changing your search or filters.</p>
            </div>

            <div class="hidden px-6 py-16 text-center" role="alert" data-reviews-error>
                <span class="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-red-50 text-red-500" aria-hidden="true"><i class="fa-solid fa-triangle-exclamation text-xl"></i></span>
                <h3 class="mt-4 font-semibold text-[#0B1930]">Unable to load reviews</h3>
                <p class="mt-1 text-sm text-slate-500">Please try again.</p>
                <button type="button" class="mt-5 inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-orange-500 px-4 text-sm font-semibold text-orange-600 transition hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500" data-reviews-retry>Retry</button>
            </div>
        </section>
    </div>
@endsection
