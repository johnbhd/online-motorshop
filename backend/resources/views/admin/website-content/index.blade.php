@extends('layouts.admin')

@section('title', 'Admin Website Content | ALD Motorshop')

@php
    $contentTabs = [
        'Homepage',
        'Featured Products',
        'Promotions',
        'Announcements',
        'FAQs',
        'Business Information',
    ];

    $homepageSections = [
        ['key' => 'brands', 'label' => 'Brands'],
        ['key' => 'categories', 'label' => 'Categories'],
        ['key' => 'featured_products', 'label' => 'Featured Products'],
        ['key' => 'how_ordering_works', 'label' => 'How Ordering Works'],
        ['key' => 'pickup_delivery', 'label' => 'Pickup & Delivery'],
        ['key' => 'customer_reviews', 'label' => 'Customer Reviews'],
        ['key' => 'branch_locations', 'label' => 'Branch Locations'],
    ];
@endphp

@section('content')
    <div
        class="space-y-5"
        aria-busy="true"
        data-admin-website-content
        data-admin-website-content-endpoint="{{ route('admin.website-content.data') }}"
    >
        <div
            class="hidden rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
            role="alert"
            data-content-error
        >
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p>Unable to load website content. Please try again.</p>

                <button
                    type="button"
                    class="inline-flex min-h-9 w-fit cursor-pointer items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-2 font-semibold transition hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    data-content-retry
                >
                    Retry
                </button>
            </div>
        </div>

        <section
            class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"
            aria-labelledby="website-content-heading"
        >
            <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
                    Website Management
                </p>

                <h2
                    id="website-content-heading"
                    class="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl"
                >
                    Website Content
                </h2>

                <p class="mt-2 text-sm text-slate-600 sm:text-base">
                    Update the public homepage content and choose which sections customers can see.
                </p>
            </div>

            <div class="flex flex-col gap-3 sm:flex-row">
                <a
                    href="{{ route('home') }}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                >
                    <i
                        class="fa-regular fa-eye"
                        aria-hidden="true"
                    ></i>

                    <span>Preview Website</span>
                </a>

                <button
                    type="submit"
                    form="website-content-form"
                    class="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:bg-orange-400"
                    data-content-save
                >
                    <i
                        class="fa-solid fa-floppy-disk"
                        aria-hidden="true"
                    ></i>

                    <span data-content-save-label>Save Changes</span>
                </button>
            </div>
        </section>

        <section class="rounded-xl border border-slate-200 bg-white px-4 shadow-sm sm:px-5">
            <div class="overflow-x-auto">
                <div
                    class="flex min-w-max items-center gap-6"
                    role="tablist"
                    aria-label="Website content sections"
                >
                    @foreach ($contentTabs as $tab)
                        <button
                            type="button"
                            @class([
                                'inline-flex min-h-14 items-center border-b-2 px-0.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500',
                                'border-orange-500 text-[#0B1930]' => $tab === 'Homepage',
                                'cursor-default border-transparent text-slate-500' => $tab !== 'Homepage',
                            ])
                            @if ($tab !== 'Homepage')
                                aria-disabled="true"
                            @endif
                        >
                            {{ $tab }}
                        </button>
                    @endforeach
                </div>
            </div>
        </section>

        <div
            class="space-y-5"
            data-content-loading
        >
            <div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <x-skeleton type="list" :rows="5" />
                <x-skeleton type="list" :rows="4" />
            </div>

            <x-skeleton type="list" :rows="5" />
            <x-skeleton type="list" :rows="3" />
        </div>

        <div
            class="hidden rounded-xl border border-orange-200 bg-orange-50 px-5 py-4 text-sm text-orange-800"
            role="status"
            data-content-empty
        >
            <p class="font-semibold">No homepage content configured yet.</p>
            <p class="mt-1">Start by adding your homepage content below.</p>
        </div>

        <form
            id="website-content-form"
            class="hidden space-y-5"
            novalidate
            data-content-form
        >
            <div
                class="hidden rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700"
                role="status"
                data-content-success
            >
                Changes saved successfully.
            </div>

            <div
                class="hidden rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
                role="alert"
                data-content-validation
            ></div>

            <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div class="border-b border-slate-200 px-5 py-5 sm:px-6">
                    <h2 class="text-lg font-semibold text-[#0B1930]">
                        Hero Section
                    </h2>

                    <p class="mt-1 text-sm text-slate-500">
                        Update the main headline, supporting message, buttons, and hero image.
                    </p>
                </div>

                <div class="grid grid-cols-1 gap-6 p-5 lg:grid-cols-2 sm:p-6">
                    <div class="space-y-5">
                        <label class="block">
                            <span class="mb-2 block text-sm font-semibold text-[#0B1930]">
                                Small Label
                            </span>

                            <input
                                type="text"
                                class="min-h-11 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#0B1930] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                data-content-field="small_label"
                                required
                            >
                        </label>

                        <label class="block">
                            <span class="mb-2 block text-sm font-semibold text-[#0B1930]">
                                Main Heading
                            </span>

                            <input
                                type="text"
                                class="min-h-11 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#0B1930] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                data-content-field="heading"
                                required
                            >
                        </label>

                        <label class="block">
                            <span class="mb-2 block text-sm font-semibold text-[#0B1930]">
                                Supporting Text
                            </span>

                            <textarea
                                rows="5"
                                class="w-full resize-y rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#0B1930] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                data-content-field="supporting_text"
                                required
                            ></textarea>
                        </label>

                        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <label class="block">
                                <span class="mb-2 block text-sm font-semibold text-[#0B1930]">
                                    Primary Button Text
                                </span>

                                <input
                                    type="text"
                                    class="min-h-11 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#0B1930] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                    data-content-field="primary_button"
                                    required
                                >
                            </label>

                            <label class="block">
                                <span class="mb-2 block text-sm font-semibold text-[#0B1930]">
                                    Secondary Button Text
                                </span>

                                <input
                                    type="text"
                                    class="min-h-11 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#0B1930] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                    data-content-field="secondary_button"
                                    required
                                >
                            </label>
                        </div>
                    </div>

                    <div>
                        <p class="mb-2 text-sm font-semibold text-[#0B1930]">
                            Hero Image
                        </p>

                        <div
                            class="flex min-h-72 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center"
                            data-content-image-placeholder
                        >
                            <div>
                                <span
                                    class="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm"
                                    aria-hidden="true"
                                >
                                    <i class="fa-regular fa-image text-xl"></i>
                                </span>

                                <p class="mt-4 text-sm font-semibold text-[#0B1930]">
                                    No hero image selected
                                </p>

                                <p class="mt-1 text-xs text-slate-500">
                                    Image preview will appear here when an image is added.
                                </p>
                            </div>
                        </div>

                        <div class="mt-4 flex flex-wrap items-center gap-3">
                            <label
                                for="hero-image"
                                class="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-within:ring-2 focus-within:ring-orange-500"
                            >
                                Change Image
                            </label>

                            <input
                                id="hero-image"
                                type="file"
                                accept="image/*"
                                class="sr-only"
                                data-content-image-input
                            >

                            <span class="text-xs text-slate-500">
                                Upload a clear motorcycle or ALD promotional image.
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div class="border-b border-slate-200 px-5 py-5 sm:px-6">
                    <h2 class="text-lg font-semibold text-[#0B1930]">
                        Homepage Sections
                    </h2>

                    <p class="mt-1 text-sm text-slate-500">
                        Choose which sections are visible on the public homepage.
                    </p>
                </div>

                <div class="grid grid-cols-1 gap-x-8 gap-y-1 p-5 sm:grid-cols-2 sm:p-6">
                    @foreach ($homepageSections as $section)
                        <label class="flex min-h-14 cursor-pointer items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0 sm:last:border-b">
                            <span class="text-sm font-medium text-[#0B1930]">
                                {{ $section['label'] }}
                            </span>

                            <span class="relative inline-flex shrink-0 items-center">
                                <input
                                    type="checkbox"
                                    class="peer sr-only"
                                    data-homepage-section="{{ $section['key'] }}"
                                >

                                <span class="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-orange-500 peer-focus-visible:ring-2 peer-focus-visible:ring-orange-500 peer-focus-visible:ring-offset-2"></span>

                                <span class="pointer-events-none absolute left-1 size-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5"></span>
                            </span>
                        </label>
                    @endforeach
                </div>
            </section>

            <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div class="border-b border-slate-200 px-5 py-5 sm:px-6">
                    <h2 class="text-lg font-semibold text-[#0B1930]">
                        Call-to-Action Section
                    </h2>
                </div>

                <div class="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[minmax(12rem,0.8fr)_minmax(16rem,1.5fr)_minmax(12rem,0.8fr)] sm:p-6">
                    <label class="block">
                        <span class="mb-2 block text-sm font-semibold text-[#0B1930]">
                            Heading
                        </span>

                        <input
                            type="text"
                            class="min-h-11 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#0B1930] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            data-cta-field="heading"
                            required
                        >
                    </label>

                    <label class="block">
                        <span class="mb-2 block text-sm font-semibold text-[#0B1930]">
                            Supporting Text
                        </span>

                        <input
                            type="text"
                            class="min-h-11 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#0B1930] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            data-cta-field="supporting_text"
                            required
                        >
                    </label>

                    <label class="block">
                        <span class="mb-2 block text-sm font-semibold text-[#0B1930]">
                            Button Text
                        </span>

                        <input
                            type="text"
                            class="min-h-11 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#0B1930] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            data-cta-field="button_text"
                            required
                        >
                    </label>
                </div>
            </section>
        </form>
    </div>
@endsection
