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
    class="min-h-screen bg-slate-100 text-slate-900 antialiased"
>
    <div
        class="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]"
    >
        @include('partials.admin-sidebar')

        <div class="min-w-0">
            @include('partials.admin-header')

            <main class="p-4 sm:p-6 lg:p-8">
                @yield('content')
            </main>
        </div>
    </div>
</body>
</html>
