<!DOCTYPE html>
<html
    lang="{{ str_replace('_', '-', app()->getLocale()) }}"
>
<head>
    <meta charset="utf-8">
    <meta
        name="viewport"
        content="width=device-width, initial-scale=1"
    >

    <title>@yield('title', 'Admin Dashboard | ALD Motorshop')</title>

    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body
    class="min-h-screen overflow-x-hidden bg-slate-100 text-slate-900 antialiased"
>
    <div class="min-h-screen">
        @include('partials.admin-sidebar')

        <div class="min-w-0 lg:pl-72">
            @include('partials.admin-navbar')

            <main class="w-full min-w-0">
                <div
                    class="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6"
                >
                    @yield('content')
                </div>
            </main>
        </div>
    </div>
</body>
</html>
