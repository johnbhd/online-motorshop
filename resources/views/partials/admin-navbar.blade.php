@php
    $adminPageTitles = [
        'admin.dashboard' => 'Dashboard',
        'admin.orders.*' => 'Orders',
        'admin.payments.*' => 'Payments',
        'admin.pickups.*' => 'Pickup Requests',
        'admin.deliveries.*' => 'Delivery Requests',
        'admin.products.*' => 'Products',
        'admin.customers.*' => 'Customers',
        'admin.messages.*' => 'Messages',
        'admin.branches.*' => 'Branches',
        'admin.staff.*' => 'Staff Management',
        'admin.website-content.*' => 'Website Content',
    ];
    $adminPageTitle = 'Dashboard';

    foreach ($adminPageTitles as $routePattern => $pageTitle) {
        if (request()->routeIs($routePattern)) {
            $adminPageTitle = $pageTitle;
            break;
        }
    }

    $adminName = 'Admin User';
    $adminRole = 'Administrator';
    $adminNotificationCount = 8;
    $adminNotifications = [
        ['icon' => 'fa-regular fa-clipboard', 'title' => 'New order request', 'description' => 'Mark Reyes submitted order ALD-2026-000128.', 'time' => '5 min ago', 'unread' => true],
        ['icon' => 'fa-solid fa-credit-card', 'title' => 'Payment needs verification', 'description' => 'Payment proof for ALD-2026-000127 is waiting for Staff verification.', 'time' => '12 min ago', 'unread' => true],
        ['icon' => 'fa-solid fa-store', 'title' => 'Pickup request updated', 'description' => 'Order ALD-2026-000125 is currently being prepared for pickup.', 'time' => '28 min ago', 'unread' => false],
        ['icon' => 'fa-regular fa-message', 'title' => 'New customer message', 'description' => 'Angela Cruz sent a new customer inquiry.', 'time' => '35 min ago', 'unread' => true],
        ['icon' => 'fa-solid fa-flag', 'title' => 'Review needs attention', 'description' => 'A customer review has been flagged as inappropriate.', 'time' => '1 hr ago', 'unread' => false],
    ];
@endphp

<header class="sticky top-0 z-30 border-b border-slate-200 bg-white">
    <div
        class="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
    >
        <div class="flex min-w-0 items-center gap-3">
            <button
                type="button"
                class="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#0B1930] transition hover:bg-slate-100 focus:outline-none lg:hidden"
                aria-label="Open admin navigation"
                aria-controls="admin-sidebar"
                aria-expanded="false"
                data-admin-sidebar-open
            >
                <i
                    class="fa-solid fa-bars text-xl"
                    aria-hidden="true"
                ></i>
            </button>

            <div class="min-w-0">
                <p class="hidden truncate text-sm font-medium text-slate-500 sm:block">
                    <span>Admin Portal</span>
                    <span
                        class="mx-1 text-slate-300"
                        aria-hidden="true"
                    >
                        /
                    </span>
                    <span>{{ $adminPageTitle }}</span>
                </p>

                <h1
                    class="truncate text-lg font-semibold leading-tight text-[#0B1930] sm:mt-0.5 sm:text-xl"
                >
                    {{ $adminPageTitle }}
                </h1>
            </div>
        </div>

        <div class="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
                type="button"
                class="hidden size-9 cursor-pointer items-center justify-center text-[#0B1930] transition hover:text-orange-500 focus:outline-none sm:inline-flex"
                aria-label="Search"
            >
                <i
                    class="fa-solid fa-magnifying-glass text-lg"
                    aria-hidden="true"
                ></i>
            </button>

            <div
                class="relative inline-flex items-center justify-center"
                data-admin-notification-dropdown
            >
                <button
                    type="button"
                    class="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center text-[#0B1930] transition hover:text-orange-500 focus:outline-none"
                    aria-label="Notifications, {{ $adminNotificationCount }} unread"
                    aria-haspopup="menu"
                    aria-expanded="false"
                    aria-controls="admin-notification-menu"
                    data-admin-notification-trigger
                >
                    <i
                        class="fa-regular fa-bell text-xl"
                        aria-hidden="true"
                    ></i>
                </button>

                <span
                    class="pointer-events-none absolute right-0 top-0 z-10 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-orange-500 px-0 text-[8px] font-bold leading-none text-white ring-2 ring-white"
                    aria-hidden="true"
                >
                    {{ $adminNotificationCount }}
                </span>

                <div
                    id="admin-notification-menu"
                    class="absolute right-0 top-full z-50 mt-2 hidden w-[calc(100vw-1rem)] max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:w-80"
                    role="menu"
                    aria-label="Notifications"
                    data-admin-notification-menu
                >
                    <div class="border-b border-slate-100 px-4 py-3.5">
                        <h2 class="text-sm font-bold text-[#0B1930]">
                            Notifications
                        </h2>
                    </div>

                    <div class="max-h-96 overflow-y-auto">
                        @foreach ($adminNotifications as $notification)
                            <button
                                type="button"
                                @class([
                                    'flex w-full cursor-pointer items-start gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none',
                                    'bg-orange-50/60' => $notification['unread'],
                                    'bg-white' => ! $notification['unread'],
                                ])
                                role="menuitem"
                            >
                                <span
                                    @class([
                                        'inline-flex size-9 shrink-0 items-center justify-center rounded-lg',
                                        'bg-orange-100 text-orange-600' => $notification['unread'],
                                        'bg-slate-100 text-slate-500' => ! $notification['unread'],
                                    ])
                                    aria-hidden="true"
                                >
                                    <i class="{{ $notification['icon'] }} text-sm"></i>
                                </span>

                                <span class="min-w-0 flex-1">
                                    <span class="flex items-center gap-2">
                                        @if ($notification['unread'])
                                            <span
                                                class="size-1.5 shrink-0 rounded-full bg-orange-500"
                                                aria-label="Unread"
                                            ></span>
                                        @endif

                                        <span class="truncate text-sm font-semibold text-[#0B1930]">
                                            {{ $notification['title'] }}
                                        </span>
                                    </span>

                                    <span class="mt-1 block text-xs leading-5 text-slate-500">
                                        {{ $notification['description'] }}
                                    </span>

                                    <span class="mt-1 block text-xs font-medium text-slate-400">
                                        {{ $notification['time'] }}
                                    </span>
                                </span>
                            </button>
                        @endforeach
                    </div>
                </div>
            </div>

            <span
                class="mx-2 hidden h-8 w-px bg-slate-200 sm:block"
                aria-hidden="true"
            ></span>

            <div
                class="relative"
                data-admin-profile-dropdown
            >
                <button
                    type="button"
                    class="flex cursor-pointer items-center gap-3 rounded-xl p-1.5 text-left transition hover:bg-slate-100 focus:outline-none"
                    aria-haspopup="menu"
                    aria-expanded="false"
                    data-admin-profile-trigger
                >
                    <span
                        class="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200"
                        aria-hidden="true"
                    >
                        <i
                            class="fa-regular fa-user text-base"
                            aria-hidden="true"
                        ></i>
                    </span>

                    <span class="hidden min-w-0 sm:block">
                        <span class="block max-w-40 truncate text-sm font-semibold leading-5 text-[#0B1930]">
                            {{ $adminName }}
                        </span>

                        <span class="block text-xs leading-4 text-slate-500">
                            {{ $adminRole }}
                        </span>
                    </span>

                    <i
                        class="fa-solid fa-chevron-down hidden text-xs text-[#0B1930] transition-transform sm:block"
                        aria-hidden="true"
                        data-admin-profile-chevron
                    ></i>
                </button>

                <div
                    class="absolute right-0 top-full mt-2 hidden w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl"
                    role="menu"
                    data-admin-profile-menu
                >
                    <a
                        href="{{ Illuminate\Support\Facades\Route::has('admin.profile.index') ? route('admin.profile.index') : '#' }}"
                        class="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-[#0B1930] focus:bg-slate-50 focus:outline-none"
                        role="menuitem"
                    >
                        <i
                            class="fa-regular fa-user w-4 text-center text-slate-400"
                            aria-hidden="true"
                        ></i>

                        <span>Profile</span>
                    </a>

                    <div class="my-1 border-t border-slate-100"></div>

                    <a
                        href="{{ route('home') }}"
                        class="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-[#0B1930] focus:bg-slate-50 focus:outline-none"
                        role="menuitem"
                    >
                        <i
                            class="fa-solid fa-right-from-bracket w-4 text-center text-slate-400"
                            aria-hidden="true"
                        ></i>

                        <span>Logout</span>
                    </a>
                </div>
            </div>
        </div>
    </div>
</header>
