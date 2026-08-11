@php
    $staffNavigationItems = [
        [
            'label' => 'Dashboard',
            'key' => 'dashboard',
            'route' => 'staff.dashboard',
            'active' => 'staff.dashboard',
            'icon' => 'fa-solid fa-table-columns',
        ],
        [
            'label' => 'Orders',
            'key' => 'orders',
            'route' => 'staff.orders.index',
            'active' => 'staff.orders.*',
            'icon' => 'fa-solid fa-clipboard-list',
        ],
        [
            'label' => 'Payments',
            'key' => 'payments',
            'route' => 'staff.payments.index',
            'active' => 'staff.payments.*',
            'icon' => 'fa-regular fa-credit-card',
        ],
        [
            'label' => 'Pickup Requests',
            'key' => 'pickup-requests',
            'route' => 'staff.pickup-requests.index',
            'active' => 'staff.pickup-requests.*',
            'icon' => 'fa-solid fa-store',
        ],
        [
            'label' => 'Delivery Requests',
            'key' => 'delivery-requests',
            'route' => 'staff.delivery-requests.index',
            'active' => 'staff.delivery-requests.*',
            'icon' => 'fa-solid fa-motorcycle',
        ],
        [
            'label' => 'Products',
            'key' => 'products',
            'route' => 'staff.products.index',
            'active' => 'staff.products.*',
            'icon' => 'fa-solid fa-box-open',
        ],
        [
            'label' => 'Messages',
            'key' => 'messages',
            'route' => 'staff.messages.index',
            'active' => 'staff.messages.*',
            'icon' => 'fa-regular fa-message',
        ],
        [
            'label' => 'Customers',
            'key' => 'customers',
            'route' => 'staff.customers.index',
            'active' => 'staff.customers.*',
            'icon' => 'fa-solid fa-users',
        ],
        [
            'label' => 'Reviews',
            'key' => 'reviews',
            'route' => 'staff.reviews.index',
            'active' => 'staff.reviews.*',
            'icon' => 'fa-regular fa-star',
        ],
        [
            'label' => 'Reports',
            'key' => 'reports',
            'route' => 'staff.reports.index',
            'active' => 'staff.reports.*',
            'icon' => 'fa-solid fa-chart-column',
        ],
        [
            'label' => 'Profile',
            'key' => 'profile',
            'route' => 'staff.profile.index',
            'active' => 'staff.profile.*',
            'icon' => 'fa-regular fa-user',
        ],
    ];

    $staffNavigationBadges = $staffNavigationBadges ?? [
        'orders' => 8,
        'payments' => 3,
        'pickup-requests' => 4,
        'delivery-requests' => 2,
        'messages' => 5,
    ];
@endphp

<button
    type="button"
    class="fixed inset-0 z-40 hidden bg-slate-950/60 backdrop-blur-[1px] lg:hidden"
    aria-label="Close staff navigation"
    data-staff-sidebar-overlay
></button>

<aside
    id="staff-sidebar"
    class="fixed inset-y-0 left-0 z-50 flex w-72 -translate-x-full flex-col overflow-y-auto border-r border-white/10 bg-[#0B1930] text-slate-200 shadow-2xl transition-transform duration-300 ease-out lg:translate-x-0 lg:shadow-none"
    aria-label="Staff navigation"
    data-staff-sidebar
>
    <div class="relative border-b border-white/10 px-6 pb-6 pt-7">
        <button
            type="button"
            class="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 lg:hidden"
            aria-label="Close staff navigation"
            data-staff-sidebar-close
        >
            <i
                class="fa-solid fa-xmark text-xl"
                aria-hidden="true"
            ></i>
        </button>

        <a
            href="{{ route('staff.dashboard') }}"
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
                Staff Portal
            </span>
        </a>
    </div>

    <nav class="flex-1 px-3 py-5">
        <ul class="space-y-1">
            @foreach ($staffNavigationItems as $item)
                @php
                    $isActive = request()->routeIs($item['active']);
                    $itemUrl = \Illuminate\Support\Facades\Route::has($item['route'])
                        ? route($item['route'])
                        : '#';
                    $badgeValue = $staffNavigationBadges[$item['key']] ?? null;
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

                        @if ($badgeValue !== null)
                            <span
                                class="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold leading-none text-white"
                                aria-label="{{ $badgeValue }} notifications"
                            >
                                {{ $badgeValue }}
                            </span>
                        @endif
                    </a>
                </li>
            @endforeach
        </ul>
    </nav>

    <div class="mt-auto border-t border-white/10 p-3">
        @if (\Illuminate\Support\Facades\Route::has('logout'))
            <form
                method="POST"
                action="{{ route('logout') }}"
            >
                @csrf

                <button
                    type="submit"
                    class="group flex min-h-11 w-full items-center gap-3 rounded-lg border-l-4 border-transparent px-3 py-2.5 text-left text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500"
                >
                    <i
                        class="fa-solid fa-right-from-bracket w-5 shrink-0 text-center text-slate-400 transition-colors group-hover:text-orange-400"
                        aria-hidden="true"
                    ></i>

                    <span>Logout</span>
                </button>
            </form>
        @else
            <button
                type="button"
                class="group flex min-h-11 w-full items-center gap-3 rounded-lg border-l-4 border-transparent px-3 py-2.5 text-left text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500"
            >
                <i
                    class="fa-solid fa-right-from-bracket w-5 shrink-0 text-center text-slate-400 transition-colors group-hover:text-orange-400"
                    aria-hidden="true"
                ></i>

                <span>Logout</span>
            </button>
        @endif
    </div>
</aside>
