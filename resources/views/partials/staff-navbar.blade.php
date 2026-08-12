@php
    $staffPageTitles = [
        'staff.dashboard' => 'Dashboard',
        'staff.orders.*' => 'Orders',
        'staff.payments.*' => 'Payments',
        'staff.pickup-requests.*' => 'Pickup Requests',
        'staff.delivery-requests.*' => 'Delivery Requests',
        'staff.products.*' => 'Products',
        'staff.messages.*' => 'Messages',
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
    $staffNotificationCount = $staffNotificationCount ?? 7;
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

            <div class="relative inline-flex items-center justify-center">
                <button
                    type="button"
                    class="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center text-[#0B1930] transition hover:text-orange-500 focus:outline-none"
                    aria-label="Notifications, {{ $staffNotificationCount }} unread"
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
                    >
                        {{ $staffNotificationCount > 9 ? '9+' : $staffNotificationCount }}
                    </span>
                @endif
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
                        class="group flex min-h-11 w-full items-center gap-3 rounded-lg border-l-4 border-transparent px-3 py-2.5 text-left text-sm font-medium text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500"
                    >
                        <i
                            class="fa-solid fa-right-from-bracket w-5 shrink-0 text-center text-slate-500 transition-colors"
                            aria-hidden="true"
                        ></i>

                        <span>Logout</span>
                    </a>
                </div>
            </div>
        </div>
    </div>
</header>
