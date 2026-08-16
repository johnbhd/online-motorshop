<header class="border-b border-slate-200 bg-white">
    <nav
        class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
    >
        <a
            href="{{ route('home') }}"
            class="text-lg font-bold text-slate-950"
        >
            ALD

            <span class="text-amber-500">
                Motorshop
            </span>
        </a>

        <div class="flex gap-3">
            <a
                href="{{ route('auth.login') }}"
                class="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
                Login
            </a>
            <a
                href="{{ route('about') }}"
                class="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
                About
            </a>
            <a
                href="{{ route('staff.dashboard') }}"
                class="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
                Staff
            </a>
        </div>
    </nav>
</header>
