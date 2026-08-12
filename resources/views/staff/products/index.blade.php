@extends('layouts.staff')

@section('title', 'Staff Products | ALD Motorshop')
@section('header-title', 'Products')

@php
    $availabilityTabs = [
        ['key' => 'all', 'label' => 'All Products', 'countKey' => 'total', 'count' => 86],
        ['key' => 'available', 'label' => 'Available', 'countKey' => 'available', 'count' => 52],
        ['key' => 'low_stock', 'label' => 'Low Stock', 'countKey' => 'low_stock', 'count' => 8],
        ['key' => 'subject_to_confirmation', 'label' => 'Subject to Confirmation', 'countKey' => 'subject_to_confirmation', 'count' => 10],
        ['key' => 'out_of_stock', 'label' => 'Out of Stock', 'countKey' => 'out_of_stock', 'count' => 7],
        ['key' => 'unavailable', 'label' => 'Unavailable'],
        ['key' => 'archived', 'label' => 'Archived'],
    ];
@endphp

@section('content')
    <div class="space-y-5" data-staff-products data-products-endpoint="{{ route('staff.products.data') }}">
        <section class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between" aria-labelledby="products-page-heading">
            <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">Product Availability</p>
                <h2 id="products-page-heading" class="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl">Motorcycle Products</h2>
                <p class="mt-2 text-sm text-slate-600 sm:text-base">View motorcycle parts and keep product availability up to date for customer orders.</p>
            </div>
            <div class="inline-flex min-h-11 w-fit items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-800">
                <span class="inline-flex size-8 items-center justify-center rounded-lg bg-white text-orange-600 shadow-sm" aria-hidden="true"><i class="fa-solid fa-clock"></i></span>
                <span><strong data-products-attention-count>4</strong> products need attention</span>
            </div>
        </section>

        <section class="rounded-xl border border-slate-200 bg-white px-4 shadow-sm sm:px-5" aria-label="Product availability navigation">
            <div class="overflow-x-auto"><div class="flex min-w-max items-center gap-6" role="tablist" aria-label="Filter products by availability">
                @foreach ($availabilityTabs as $tab)
                    <button type="button" @class([
                        'inline-flex min-h-14 cursor-pointer items-center gap-2 border-b-2 px-0.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
                        'border-orange-500 text-[#0B1930]' => $tab['key'] === 'all',
                        'border-transparent text-slate-500 hover:text-[#0B1930]' => $tab['key'] !== 'all',
                    ]) role="tab" aria-selected="{{ $tab['key'] === 'all' ? 'true' : 'false' }}" data-products-tab="{{ $tab['key'] }}">
                        <span>{{ $tab['label'] }}</span>
                        @isset($tab['count'])<span class="inline-flex min-w-6 items-center justify-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-600" data-products-summary="{{ $tab['countKey'] }}">{{ $tab['count'] }}</span>@endisset
                    </button>
                @endforeach
            </div></div>
        </section>

        <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="Product filters">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(17rem,1fr)_10rem_13rem_13rem_auto]">
                <label class="relative block"><span class="sr-only">Search products</span><i class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" aria-hidden="true"></i><input type="search" class="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-[#0B1930] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100" placeholder="Search product name or part number" data-products-search></label>
                <label class="relative block"><span class="sr-only">Filter by brand</span><select class="min-h-11 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" data-products-brand><option value="all">All Brands</option>@foreach (['Honda', 'Yamaha', 'Suzuki', 'Universal'] as $brand)<option value="{{ $brand }}">{{ $brand }}</option>@endforeach</select><i class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" aria-hidden="true"></i></label>
                <label class="relative block"><span class="sr-only">Filter by category</span><select class="min-h-11 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" data-products-category><option value="all">All Categories</option>@foreach (['Brake Parts', 'Batteries', 'Maintenance Parts', 'Oils and Lubricants', 'Electrical Parts', 'Tires'] as $category)<option value="{{ $category }}">{{ $category }}</option>@endforeach</select><i class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" aria-hidden="true"></i></label>
                <label class="relative block"><span class="sr-only">Filter by availability</span><select class="min-h-11 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" data-products-availability><option value="all">All Availability</option>@foreach (['Available', 'Low Stock', 'Subject to Confirmation', 'Out of Stock', 'Unavailable', 'Archived'] as $availability)<option value="{{ $availability }}">{{ $availability }}</option>@endforeach</select><i class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" aria-hidden="true"></i></label>
                <button type="button" class="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500" data-products-clear><i class="fa-solid fa-rotate-left text-xs" aria-hidden="true"></i><span>Clear</span></button>
            </div>
        </section>

        <section class="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-labelledby="product-list-heading" aria-busy="true" data-products-panel>
            <div class="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div><h2 id="product-list-heading" class="text-lg font-semibold text-[#0B1930]">Product List</h2><p class="mt-1 text-sm text-slate-500"><span data-products-total-label>86</span> motorcycle products</p></div>
                <label class="relative block w-full sm:w-44"><span class="sr-only">Sort products</span><select class="min-h-10 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" data-products-sort><option value="name">Product Name</option><option value="updated">Recently Updated</option></select><i class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" aria-hidden="true"></i></label>
            </div>
            <div role="status" aria-live="polite" data-products-loading><span class="sr-only">Loading products.</span><div class="overflow-x-auto"><table class="w-full min-w-[1120px] border-collapse text-left"><thead class="bg-slate-50">@include('staff.products.partials.table-head')</thead><tbody>@for ($rowIndex = 0; $rowIndex < 8; $rowIndex++)<x-skeleton type="table-row" :columns="8" />@endfor</tbody></table></div></div>
            <div class="hidden" data-products-content><div class="overflow-x-auto"><table class="w-full min-w-[1120px] border-collapse text-left"><thead class="bg-slate-50">@include('staff.products.partials.table-head')</thead><tbody class="divide-y divide-slate-100" data-products-body></tbody></table></div><div class="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p class="text-sm text-slate-500">Showing <span class="font-semibold text-slate-700" data-products-showing>1–8</span> of <span class="font-semibold text-slate-700" data-products-total>86</span> products</p><nav class="flex flex-wrap items-center gap-1" aria-label="Products pagination"><button type="button" class="min-h-9 cursor-not-allowed rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-400" disabled>Previous</button>@for ($page = 1; $page <= 5; $page++)<button type="button" @class(['inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500', 'bg-orange-500 text-white' => $page === 1, 'text-slate-600 hover:bg-slate-100' => $page !== 1]) @if ($page === 1) aria-current="page" @endif>{{ $page }}</button>@endfor<span class="px-1 text-slate-400">…</span><button type="button" class="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100">11</button><button type="button" class="min-h-9 cursor-pointer rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-600 transition hover:border-orange-300 hover:text-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">Next</button></nav></div></div>
            <div class="hidden px-6 py-16 text-center" data-products-empty><span class="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400" aria-hidden="true"><i class="fa-solid fa-box-open text-xl"></i></span><h3 class="mt-4 font-semibold text-[#0B1930]">No products found</h3><p class="mt-1 text-sm text-slate-500">Try changing your search or filters.</p></div>
            <div class="hidden px-6 py-16 text-center" role="alert" data-products-error><span class="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-red-50 text-red-500" aria-hidden="true"><i class="fa-solid fa-triangle-exclamation text-xl"></i></span><h3 class="mt-4 font-semibold text-[#0B1930]">Unable to load products</h3><p class="mt-1 text-sm text-slate-500">Please try again.</p><button type="button" class="mt-5 inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-orange-500 px-4 text-sm font-semibold text-orange-600 transition hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500" data-products-retry>Retry</button></div>
        </section>
    </div>
@endsection
