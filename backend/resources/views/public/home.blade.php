@extends('layouts.public')

@section('title', 'ALD Motorshop')

@section('content')
    <section
        class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
    >
        <p
            class="text-sm font-semibold uppercase tracking-[0.2em] text-amber-500"
        >
            ALD Motorshop
        </p>

        <h1
            class="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl"
        >
            Motorcycle parts you can rely on.
        </h1>

        <p class="mt-4 max-w-2xl text-lg text-slate-600">
            Find quality motorcycle parts and accessories for your next ride.
        </p>

        <a
            href="#"
            class="mt-8 inline-flex rounded-lg bg-amber-500 px-5 py-3 font-semibold text-white transition hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        >
            Browse products
        </a>
    </section>
@endsection
