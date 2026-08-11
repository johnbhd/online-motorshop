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

    <title>@yield('title', 'ALD Motorshop')</title>

    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body
    class="min-h-screen bg-slate-50 text-slate-900 antialiased"
>
    @include('partials.public-navbar')

    <main>
        @yield('content')
    </main>

    @include('partials.public-footer')
</body>
</html>
