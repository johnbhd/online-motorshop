@extends('layouts.admin')

@section('title', 'Admin Products | ALD Motorshop')

@php
    $mainTabs = [
        ['key' => 'products', 'label' => 'Product List'],
        ['key' => 'categories', 'label' => 'Categories & Brands'],
        ['key' => 'compatibility', 'label' => 'Motorcycle Models & Compatibility'],
    ];

    $availabilityTabs = [
        ['key' => 'all', 'label' => 'All Products', 'countKey' => 'total', 'count' => 86],
        ['key' => 'available', 'label' => 'Available', 'countKey' => 'available', 'count' => 52],
        ['key' => 'low_stock', 'label' => 'Low Stock', 'countKey' => 'low_stock', 'count' => 8],
        ['key' => 'subject_to_confirmation', 'label' => 'Subject to Confirmation', 'countKey' => 'subject_to_confirmation', 'count' => 10],
        ['key' => 'out_of_stock', 'label' => 'Out of Stock', 'countKey' => 'out_of_stock', 'count' => 7],
        ['key' => 'unavailable', 'label' => 'Unavailable', 'countKey' => 'unavailable', 'count' => 5],
        ['key' => 'archived', 'label' => 'Archived', 'countKey' => 'archived', 'count' => 4],
    ];

    $summaryCards = [
        ['key' => 'total', 'label' => 'Total Products', 'description' => 'All motorcycle products', 'icon' => 'fa-solid fa-box', 'tone' => 'orange'],
        ['key' => 'available', 'label' => 'Available', 'description' => 'Available for orders', 'icon' => 'fa-solid fa-circle-check', 'tone' => 'green'],
        ['key' => 'needs_attention', 'label' => 'Need Attention', 'description' => 'Low stock or confirmation', 'icon' => 'fa-solid fa-triangle-exclamation', 'tone' => 'orange'],
        ['key' => 'out_of_stock', 'label' => 'Out of Stock', 'description' => 'Currently unavailable', 'icon' => 'fa-solid fa-box-open', 'tone' => 'red'],
    ];
@endphp

@section('content')
    <div
        class="space-y-5"
        aria-busy="true"
        data-admin-products
        data-admin-products-endpoint="{{ route('admin.products.data') }}"
    >
        <div
            class="hidden rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
            role="alert"
            data-admin-products-error
        >
            <div
                class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
                <p>Unable to load products. Please try again.</p>

                <button
                    type="button"
                    class="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    data-admin-products-retry
                >
                    Retry
                </button>
            </div>
        </div>

        <section
            class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"
            aria-labelledby="admin-products-heading"
        >
            <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
                    Product Management
                </p>

                <h2
                    id="admin-products-heading"
                    class="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl"
                >
                    Products
                </h2>

                <p class="mt-2 text-sm text-slate-600 sm:text-base">
                    Manage motorcycle parts, categories, brands, availability, and product information.
                </p>
            </div>

            <div
                class="inline-flex min-h-11 w-fit items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-800"
            >
                <span
                    class="inline-flex size-8 items-center justify-center rounded-lg bg-white text-orange-600 shadow-sm"
                    aria-hidden="true"
                >
                    <i class="fa-solid fa-boxes-stacked"></i>
                </span>

                <span>
                    <strong data-admin-products-attention>8</strong> products need attention
                </span>
            </div>
        </section>

        <section
            class="rounded-xl border border-slate-200 bg-white px-4 shadow-sm sm:px-5"
            aria-label="Product management tabs"
        >
            <div class="overflow-x-auto">
                <div
                    class="flex min-w-max items-center gap-6"
                    role="tablist"
                    aria-label="Product management sections"
                >
                    @foreach ($mainTabs as $tab)
                        <button
                            type="button"
                            @class([
                                'inline-flex min-h-14 cursor-pointer items-center border-b-2 px-0.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
                                'border-orange-500 text-[#0B1930]' => $tab['key'] === 'products',
                                'border-transparent text-slate-500 hover:text-[#0B1930]' => $tab['key'] !== 'products',
                            ])
                            role="tab"
                            aria-selected="{{ $tab['key'] === 'products' ? 'true' : 'false' }}"
                            data-admin-products-main-tab="{{ $tab['key'] }}"
                        >
                            {{ $tab['label'] }}
                        </button>
                    @endforeach
                </div>
            </div>
        </section>

        <section data-admin-products-main-panel="products">
            <section aria-label="Product summary">
                <div
                    class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
                    role="status"
                    aria-live="polite"
                    data-admin-products-summary-loading
                >
                    <span class="sr-only">Loading product summary.</span>

                    @for ($cardIndex = 0; $cardIndex < 4; $cardIndex++)
                        <x-skeleton type="stat" />
                    @endfor
                </div>

                <div
                    class="hidden grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
                    data-admin-products-summary-content
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
                                        'bg-red-50 text-red-600' => $card['tone'] === 'red',
                                    ])
                                    aria-hidden="true"
                                >
                                    <i class="{{ $card['icon'] }} text-lg"></i>
                                </span>

                                <div class="min-w-0">
                                    <p
                                        class="text-3xl font-bold tracking-tight text-[#0B1930]"
                                        data-admin-products-summary="{{ $card['key'] }}"
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

            <section
                class="mt-5 rounded-xl border border-slate-200 bg-white px-4 shadow-sm sm:px-5"
                aria-label="Product availability navigation"
            >
                <div class="overflow-x-auto">
                    <div
                        class="flex min-w-max items-center gap-6"
                        role="tablist"
                        aria-label="Filter products by availability"
                    >
                        @foreach ($availabilityTabs as $tab)
                            <button
                                type="button"
                                @class([
                                    'inline-flex min-h-14 cursor-pointer items-center gap-2 border-b-2 px-0.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
                                    'border-orange-500 text-[#0B1930]' => $tab['key'] === 'all',
                                    'border-transparent text-slate-500 hover:text-[#0B1930]' => $tab['key'] !== 'all',
                                ])
                                role="tab"
                                aria-selected="{{ $tab['key'] === 'all' ? 'true' : 'false' }}"
                                data-admin-products-status-tab="{{ $tab['key'] }}"
                            >
                                <span>{{ $tab['label'] }}</span>

                                <span
                                    class="inline-flex min-w-6 items-center justify-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-600"
                                    data-admin-products-status-count="{{ $tab['countKey'] }}"
                                >
                                    {{ $tab['count'] }}
                                </span>
                            </button>
                        @endforeach
                    </div>
                </div>
            </section>

            <section
                class="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                aria-label="Product filters"
            >
                <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(16rem,1fr)_10rem_13rem_13rem_10rem_auto]">
                    <label class="relative block">
                        <span class="sr-only">Search products</span>
                        <i
                            class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400"
                            aria-hidden="true"
                        ></i>
                        <input
                            type="search"
                            class="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-[#0B1930] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            placeholder="Search product name or part number"
                            data-admin-products-search
                        >
                    </label>

                    @foreach ([
                        ['label' => 'Brand', 'data' => 'data-admin-products-brand', 'options' => ['All Brands' => 'all', 'Honda' => 'Honda', 'Yamaha' => 'Yamaha', 'Suzuki' => 'Suzuki', 'Universal' => 'Universal']],
                        ['label' => 'Category', 'data' => 'data-admin-products-category', 'options' => ['All Categories' => 'all', 'Brake Parts' => 'Brake Parts', 'Batteries' => 'Batteries', 'Maintenance Parts' => 'Maintenance Parts', 'Oils & Lubricants' => 'Oils & Lubricants', 'Electrical Parts' => 'Electrical Parts', 'Tires' => 'Tires']],
                        ['label' => 'Availability', 'data' => 'data-admin-products-availability', 'options' => ['All Availability' => 'all', 'Available' => 'Available', 'Low Stock' => 'Low Stock', 'Subject to Confirmation' => 'Subject to Confirmation', 'Out of Stock' => 'Out of Stock', 'Unavailable' => 'Unavailable']],
                        ['label' => 'Status', 'data' => 'data-admin-products-status', 'options' => ['All Product Statuses' => 'all', 'Active' => 'Active', 'Inactive' => 'Inactive', 'Archived' => 'Archived']],
                    ] as $filter)
                        <label class="relative block">
                            <span class="sr-only">Filter by {{ strtolower($filter['label']) }}</span>
                            <select
                                class="min-h-11 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                {{ $filter['data'] }}
                            >
                                @foreach ($filter['options'] as $optionLabel => $optionValue)
                                    <option value="{{ $optionValue }}">
                                        {{ $optionLabel }}
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
                        data-admin-products-clear
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
                class="mt-5 min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                aria-labelledby="admin-product-list-heading"
                aria-busy="true"
                data-admin-products-panel
            >
                <div
                    class="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:px-6 xl:flex-row xl:items-center xl:justify-between"
                >
                    <div>
                        <h2
                            id="admin-product-list-heading"
                            class="text-lg font-semibold text-[#0B1930]"
                        >
                            Product List
                        </h2>

                        <p class="mt-1 text-sm text-slate-500">
                            <span data-admin-products-total-label>86</span> motorcycle products
                        </p>
                    </div>

                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <button
                            type="button"
                            class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                            data-admin-products-add
                        >
                            <i
                                class="fa-solid fa-plus text-xs"
                                aria-hidden="true"
                            ></i>

                            <span>Add Product</span>
                        </button>

                        <label class="relative block w-full sm:w-44">
                            <span class="sr-only">Sort products</span>
                            <select
                                class="min-h-10 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                data-admin-products-sort
                            >
                                <option value="name">Product Name</option>
                                <option value="updated">Recently Updated</option>
                            </select>
                            <i
                                class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                                aria-hidden="true"
                            ></i>
                        </label>
                    </div>
                </div>

                <div
                    role="status"
                    aria-live="polite"
                    data-admin-products-loading
                >
                    <span class="sr-only">Loading products.</span>

                    <div class="overflow-x-auto">
                        <table class="w-full min-w-[1250px] border-collapse text-left">
                            <tbody>
                                @for ($rowIndex = 0; $rowIndex < 8; $rowIndex++)
                                    <x-skeleton
                                        type="table-row"
                                        :columns="9"
                                    />
                                @endfor
                            </tbody>
                        </table>
                    </div>
                </div>

                <div
                    class="hidden"
                    data-admin-products-content
                >
                    <div class="overflow-x-auto">
                        <table class="w-full min-w-[1250px] border-collapse text-left">
                            <thead class="bg-slate-50">
                                <tr class="border-b border-slate-200">
                                    @foreach (['Product', 'Part Number', 'Brand', 'Category', 'Price', 'Availability', 'Status', 'Updated', 'Action'] as $column)
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
                                data-admin-products-body
                            ></tbody>
                        </table>
                    </div>

                    <div
                        class="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                    >
                        <p class="text-sm text-slate-500">
                            Showing
                            <span
                                class="font-semibold text-slate-700"
                                data-admin-products-showing
                            >
                                1–8
                            </span>
                            of
                            <span
                                class="font-semibold text-slate-700"
                                data-admin-products-total
                            >
                                86
                            </span>
                            products
                        </p>

                        <nav
                            class="flex flex-wrap items-center gap-1"
                            aria-label="Products pagination"
                        >
                            <button
                                type="button"
                                class="min-h-9 cursor-not-allowed rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-400"
                                disabled
                            >
                                Previous
                            </button>

                            @for ($page = 1; $page <= 5; $page++)
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

                            <span class="px-1 text-slate-400">…</span>

                            <button
                                type="button"
                                class="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100"
                            >
                                11
                            </button>

                            <button
                                type="button"
                                class="min-h-9 cursor-pointer rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-600 transition hover:border-orange-300 hover:text-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                            >
                                Next
                            </button>
                        </nav>
                    </div>
                </div>

                <div
                    class="hidden px-6 py-16 text-center"
                    data-admin-products-empty
                >
                    <span
                        class="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"
                        aria-hidden="true"
                    >
                        <i class="fa-solid fa-box-open text-xl"></i>
                    </span>

                    <h3 class="mt-4 font-semibold text-[#0B1930]">
                        No products found
                    </h3>

                    <p class="mt-1 text-sm text-slate-500">
                        Try changing your search or filters.
                    </p>
                </div>
            </section>
        </section>

        <section
            class="hidden"
            data-admin-products-main-panel="categories"
        >
            <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
                @foreach ([
                    ['title' => 'Categories', 'singular' => 'Category', 'button' => 'Add Category', 'body' => 'data-admin-products-categories'],
                    ['title' => 'Brands', 'singular' => 'Brand', 'button' => 'Add Brand', 'body' => 'data-admin-products-brands'],
                ] as $management)
                    <section
                        class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                        aria-labelledby="{{ strtolower(str_replace(' ', '-', $management['title'])) }}-heading"
                    >
                        <div
                            class="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6"
                        >
                            <h2
                                id="{{ strtolower(str_replace(' ', '-', $management['title'])) }}-heading"
                                class="text-lg font-semibold text-[#0B1930]"
                            >
                                {{ $management['title'] }}
                            </h2>

                            <button
                                type="button"
                                class="inline-flex min-h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-orange-500 px-3 text-xs font-semibold text-white transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                            >
                                <i
                                    class="fa-solid fa-plus text-[10px]"
                                    aria-hidden="true"
                                ></i>

                                <span>{{ $management['button'] }}</span>
                            </button>
                        </div>

                        <div class="overflow-x-auto">
                            <table class="w-full min-w-[480px] border-collapse text-left">
                                <thead class="bg-slate-50">
                                    <tr class="border-b border-slate-200">
                                        @foreach ([$management['singular'], 'Products', 'Status', 'Action'] as $column)
                                            <th
                                                scope="col"
                                                class="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                                            >
                                                {{ $column }}
                                            </th>
                                        @endforeach
                                    </tr>
                                </thead>

                                <tbody
                                    class="divide-y divide-slate-100"
                                    {{ $management['body'] }}
                                ></tbody>
                            </table>
                        </div>
                    </section>
                @endforeach
            </div>
        </section>

        <section
            class="hidden"
            data-admin-products-main-panel="compatibility"
        >
            <section
                class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                aria-labelledby="compatibility-heading"
            >
                <div
                    class="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:px-6 xl:flex-row xl:items-center xl:justify-between"
                >
                    <div>
                        <h2
                            id="compatibility-heading"
                            class="text-lg font-semibold text-[#0B1930]"
                        >
                            Motorcycle Models & Compatibility
                        </h2>

                        <p class="mt-1 text-sm text-slate-500">
                            Manage motorcycle models and compatible parts.
                        </p>
                    </div>

                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <label class="relative block w-full sm:w-52">
                            <span class="sr-only">Search motorcycle models</span>
                            <i
                                class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400"
                                aria-hidden="true"
                            ></i>
                            <input
                                type="search"
                                class="min-h-10 w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-[#0B1930] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                placeholder="Search model"
                                data-admin-products-model-search
                            >
                        </label>

                        <label class="relative block w-full sm:w-32">
                            <span class="sr-only">Filter models by brand</span>
                            <select
                                class="min-h-10 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                data-admin-products-model-brand
                            >
                                <option value="all">All Brands</option>
                                <option value="Honda">Honda</option>
                                <option value="Yamaha">Yamaha</option>
                                <option value="Suzuki">Suzuki</option>
                            </select>
                            <i
                                class="fa-solid fa-chevron-down pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                                aria-hidden="true"
                            ></i>
                        </label>

                        <button
                            type="button"
                            class="inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                        >
                            <i
                                class="fa-solid fa-plus text-xs"
                                aria-hidden="true"
                            ></i>

                            <span>Add Motorcycle Model</span>
                        </button>
                    </div>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full min-w-[880px] border-collapse text-left">
                        <thead class="bg-slate-50">
                            <tr class="border-b border-slate-200">
                                @foreach (['Model', 'Brand', 'Year / Series', 'Compatible Products', 'Status', 'Action'] as $column)
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
                            data-admin-products-models
                        ></tbody>
                    </table>
                </div>
            </section>
        </section>
    </div>
@endsection
