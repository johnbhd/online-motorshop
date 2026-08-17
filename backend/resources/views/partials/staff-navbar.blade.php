@php
    $staffPageTitles = [
        'staff.dashboard' => 'Dashboard',
        'staff.orders.*' => 'Orders',
        'staff.payments.*' => 'Payments',
        'staff.pickup-requests.*' => 'Pickup Requests',
        'staff.delivery-requests.*' => 'Delivery Requests',
        'staff.products.*' => 'Products',
        'staff.messages.*' => 'Messages',
        'staff.notifications.*' => 'Notifications',
        'staff.customers.*' => 'Customers',
        'staff.reviews.*' => 'Reviews',
        'staff.reports.*' => 'Reports',
        'staff.profile.*' => 'Profile',
    ];

    $routePageTitle = 'Dashboard';

    foreach ($staffPageTitles as $routePattern => $pageTitle) {
        if (request()->routeIs($routePattern)) {
            $routePageTitle = $pageTitle;
            break;
        }
    }

    $staffPageTitle = trim($__env->yieldContent('header-title')) ?: $routePageTitle;
    $staffName = auth()->user()?->name ?? 'Staff User';
    $staffRole = 'Staff';
    $staffNotifications = $staffNotifications ?? [
        [
            'type' => 'Orders',
            'icon' => 'fa-regular fa-clipboard',
            'title' => 'New order request',
            'description' => 'Mark Reyes submitted order ALD-2026-000128.',
            'time' => '5 min ago',
            'unread' => true,
        ],
        [
            'type' => 'Payments',
            'icon' => 'fa-solid fa-credit-card',
            'title' => 'Payment needs verification',
            'description' => 'Payment proof for ALD-2026-000127 is waiting for Staff verification.',
            'time' => '12 min ago',
            'unread' => true,
        ],
        [
            'type' => 'Pickup',
            'icon' => 'fa-solid fa-box',
            'title' => 'Pickup ready for update',
            'description' => 'Order ALD-2026-000125 is currently being prepared for pickup.',
            'time' => '28 min ago',
            'unread' => false,
        ],
        [
            'type' => 'Messages',
            'icon' => 'fa-regular fa-message',
            'title' => 'New customer message',
            'description' => 'Angela Cruz sent a new customer inquiry.',
            'time' => '35 min ago',
            'unread' => true,
        ],
        [
            'type' => 'Reviews',
            'icon' => 'fa-solid fa-flag',
            'title' => 'Review needs attention',
            'description' => 'A customer review has been flagged as inappropriate.',
            'time' => '1 hr ago',
            'unread' => false,
        ],
    ];
    $staffNotificationCount = $staffNotificationCount ?? 8;
@endphp

<header
    class="sticky top-0 z-30 border-b border-slate-200 bg-white"
>
    <div
        class="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
    >
        <div class="flex min-w-0 items-center gap-3">
            <button
                type="button"
                class="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#0B1930] transition hover:bg-slate-100 focus:outline-none lg:hidden"
                aria-label="Open staff navigation"
                aria-controls="staff-sidebar"
                aria-expanded="false"
                data-staff-sidebar-open
            >
                <i
                    class="fa-solid fa-bars text-xl"
                    aria-hidden="true"
                ></i>
            </button>

            <div class="min-w-0">
                <p
                    class="hidden truncate text-sm font-medium text-slate-500 sm:block"
                >
                    <span>Staff Portal</span>
                    <span
                        class="mx-1 text-slate-300"
                        aria-hidden="true"
                    >
                        /
                    </span>
                    <span>{{ $staffPageTitle }}</span>
                </p>

                <h1
                    class="truncate text-lg font-semibold leading-tight text-[#0B1930] sm:mt-0.5 sm:text-xl"
                >
                    {{ $staffPageTitle }}
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
                data-staff-notification-dropdown
            >
                <button
                    type="button"
                    class="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center text-[#0B1930] transition hover:text-orange-500 focus:outline-none"
                    aria-label="Notifications{{ $staffNotificationCount > 0 ? ', ' . $staffNotificationCount . ' unread' : '' }}"
                    aria-haspopup="menu"
                    aria-expanded="false"
                    aria-controls="staff-notification-menu"
                    data-staff-notification-trigger
                >
                    <i
                        class="fa-regular fa-bell text-xl"
                        aria-hidden="true"
                    ></i>
                </button>

                @if ($staffNotificationCount > 0)
                    <span
                        @class([
                            'pointer-events-none absolute right-0 top-0 z-10 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-orange-500 text-[8px] font-bold leading-none text-white ring-2 ring-white',
                            'px-0' => $staffNotificationCount <= 9,
                            'px-0.5' => $staffNotificationCount > 9,
                        ])
                        aria-hidden="true"
                        data-staff-notification-badge
                    >
                        {{ $staffNotificationCount > 9 ? '9+' : $staffNotificationCount }}
                    </span>
                @endif

                <div
                    id="staff-notification-menu"
                    class="absolute right-0 top-full z-50 mt-2 hidden w-[calc(100vw-1rem)] max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:w-80"
                    role="menu"
                    aria-label="Notifications"
                    data-staff-notification-menu
                >
                    <div
                        class="flex items-center justify-between border-b border-slate-100 px-4 py-3.5"
                    >
                        <h2 class="text-sm font-bold text-[#0B1930]">
                            Notifications
                        </h2>

                        @if ($staffNotificationCount > 0)
                            <span
                                class="text-xs font-semibold text-slate-500"
                                data-staff-notification-unread-label
                            >
                                {{ $staffNotificationCount }} unread
                            </span>
                        @endif
                    </div>

                    @if (count($staffNotifications) > 0)
                        <div class="max-h-96 overflow-y-auto">
                            @foreach ($staffNotifications as $notification)
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

                                            <span
                                                @class([
                                                    'truncate text-sm',
                                                    'font-bold text-[#0B1930]' => $notification['unread'],
                                                    'font-semibold text-slate-700' => ! $notification['unread'],
                                                ])
                                            >
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
                    @else
                        <div class="px-5 py-10 text-center">
                            <span
                                class="mx-auto inline-flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-400"
                                aria-hidden="true"
                            >
                                <i class="fa-regular fa-bell text-lg"></i>
                            </span>

                            <p class="mt-3 text-sm font-semibold text-[#0B1930]">
                                No notifications
                            </p>

                            <p class="mt-1 text-xs text-slate-500">
                                You're all caught up.
                            </p>
                        </div>
                    @endif

                    <a
                        href="{{ route('staff.notifications.index') }}"
                        class="flex min-h-11 cursor-pointer items-center justify-center border-t border-slate-100 px-4 py-3 text-sm font-semibold text-orange-600 transition hover:bg-orange-50 focus:bg-orange-50 focus:outline-none"
                        role="menuitem"
                    >
                        See All Notifications
                    </a>
                </div>
            </div>

            <span
                class="mx-2 hidden h-8 w-px bg-slate-200 sm:block"
                aria-hidden="true"
            ></span>

            <div
                class="relative"
                data-staff-profile-dropdown
            >
                <button
                    type="button"
                    class="flex cursor-pointer items-center gap-3 rounded-xl p-1.5 text-left transition hover:bg-slate-100 focus:outline-none"
                    aria-haspopup="menu"
                    aria-expanded="false"
                    data-staff-profile-trigger
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
                        <span
                            class="block max-w-40 truncate text-sm font-semibold leading-5 text-[#0B1930]"
                        >
                            {{ $staffName }}
                        </span>

                        <span class="block text-xs leading-4 text-slate-500">
                            {{ $staffRole }}
                        </span>
                    </span>

                    <i
                        class="fa-solid fa-chevron-down hidden text-xs text-[#0B1930] transition-transform sm:block"
                        aria-hidden="true"
                        data-staff-profile-chevron
                    ></i>
                </button>

                <div
                    class="absolute right-0 top-full mt-2 hidden w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl"
                    role="menu"
                    data-staff-profile-menu
                >
                    <a
                        href="{{ \Illuminate\Support\Facades\Route::has('staff.profile.index') ? route('staff.profile.index') : '#' }}"
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
