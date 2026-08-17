@php
    $adminNavigationItems = [
        ['label' => 'Dashboard', 'route' => 'admin.dashboard', 'active' => 'admin.dashboard', 'icon' => 'fa-solid fa-table-columns'],
        ['label' => 'Orders', 'route' => 'admin.orders.index', 'active' => 'admin.orders.*', 'icon' => 'fa-solid fa-clipboard-list'],
        ['label' => 'Payments', 'route' => 'admin.payments.index', 'active' => 'admin.payments.*', 'icon' => 'fa-regular fa-credit-card'],
        ['label' => 'Pickup Requests', 'route' => 'admin.pickups.index', 'active' => 'admin.pickups.*', 'icon' => 'fa-solid fa-store'],
        ['label' => 'Delivery Requests', 'route' => 'admin.deliveries.index', 'active' => 'admin.deliveries.*', 'icon' => 'fa-solid fa-motorcycle'],
        ['label' => 'Products', 'route' => 'admin.products.index', 'active' => 'admin.products.*', 'icon' => 'fa-solid fa-box-open'],
        ['label' => 'Customers', 'route' => 'admin.customers.index', 'active' => 'admin.customers.*', 'icon' => 'fa-solid fa-users'],
        ['label' => 'Messages', 'route' => 'admin.messages.index', 'active' => 'admin.messages.*', 'icon' => 'fa-regular fa-message'],
        ['label' => 'Reviews', 'route' => 'admin.reviews.index', 'active' => 'admin.reviews.*', 'icon' => 'fa-regular fa-star'],
        ['label' => 'Branches', 'route' => 'admin.branches.index', 'active' => 'admin.branches.*', 'icon' => 'fa-regular fa-building'],
        ['label' => 'Staff Management', 'route' => 'admin.staff.index', 'active' => 'admin.staff.*', 'icon' => 'fa-solid fa-user-group'],
        ['label' => 'Website Content', 'route' => 'admin.website-content.index', 'active' => 'admin.website-content.*', 'icon' => 'fa-regular fa-file-lines'],
        ['label' => 'Reports', 'route' => 'admin.reports.index', 'active' => 'admin.reports.*', 'icon' => 'fa-solid fa-chart-column'],
        ['label' => 'Activity Logs', 'route' => 'admin.activity-logs.index', 'active' => 'admin.activity-logs.*', 'icon' => 'fa-solid fa-clock-rotate-left'],
        ['label' => 'Settings', 'route' => 'admin.settings.index', 'active' => 'admin.settings.*', 'icon' => 'fa-solid fa-gear'],
        ['label' => 'Profile', 'route' => 'admin.profile.index', 'active' => 'admin.profile.*', 'icon' => 'fa-regular fa-user'],
    ];
@endphp

<button
    type="button"
    class="fixed inset-0 z-40 hidden bg-slate-950/60 backdrop-blur-[1px] lg:hidden"
    aria-label="Close admin navigation"
    data-admin-sidebar-overlay
></button>

<aside
    id="admin-sidebar"
    class="fixed inset-y-0 left-0 z-50 flex w-72 -translate-x-full flex-col overflow-y-auto border-r border-white/10 bg-[#0B1930] text-slate-200 shadow-2xl transition-transform duration-300 ease-out lg:translate-x-0 lg:shadow-none"
    aria-label="Admin navigation"
    data-admin-sidebar
>
    <div class="relative border-b border-white/10 px-6 pb-6 pt-7">
        <button
            type="button"
            class="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 lg:hidden"
            aria-label="Close admin navigation"
            data-admin-sidebar-close
        >
            <i
                class="fa-solid fa-xmark text-xl"
                aria-hidden="true"
            ></i>
        </button>

        <a
            href="{{ route('admin.dashboard') }}"
            class="flex flex-col items-center text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
            <img
                src="{{ asset('img/logo.png') }}"
                alt="ALD Motorshop logo"
                class="size-20 rounded-full object-cover shadow-lg"
            >

            <span class="mt-3 text-lg font-bold tracking-wide text-white">
                ALD Motorshop
            </span>

            <span class="mt-0.5 text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
                Admin Portal
            </span>
        </a>
    </div>

    <nav class="flex-1 px-3 py-5">
        <ul class="space-y-1">
            @foreach ($adminNavigationItems as $item)
                @php
                    $isActive = request()->routeIs($item['active']);
                    $itemUrl = Illuminate\Support\Facades\Route::has($item['route'])
                        ? route($item['route'])
                        : '#';
                @endphp

                <li>
                    <a
                        href="{{ $itemUrl }}"
                        @class([
                            'group relative flex min-h-11 items-center gap-3 rounded-r-lg border-l-4 px-3 py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500',
                            'border-orange-500 bg-[#152B4B] text-white' => $isActive,
                            'border-transparent text-slate-300 hover:bg-white/[0.06] hover:text-white' => ! $isActive,
                        ])
                        @if ($isActive)
                            aria-current="page"
                        @endif
                    >
                        <span
                            @class([
                                'shrink-0 transition-colors',
                                'text-orange-400' => $isActive,
                                'text-slate-400 group-hover:text-orange-400' => ! $isActive,
                            ])
                        >
                            <i
                                class="{{ $item['icon'] }} w-5 text-center text-base"
                                aria-hidden="true"
                            ></i>
                        </span>

                        <span class="min-w-0 flex-1 truncate">
                            {{ $item['label'] }}
                        </span>
                    </a>
                </li>
            @endforeach
        </ul>
    </nav>

    <div class="mt-auto border-t border-white/10 p-3">
        <a
            href="{{ route('home') }}"
            class="group flex min-h-11 w-full items-center gap-3 rounded-lg border-l-4 border-transparent px-3 py-2.5 text-left text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500"
        >
            <i
                class="fa-solid fa-right-from-bracket w-5 shrink-0 text-center text-slate-400 transition-colors group-hover:text-orange-400"
                aria-hidden="true"
            ></i>

            <span>Logout</span>
        </a>
    </div>
</aside>
