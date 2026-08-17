@extends('layouts.public')

@section('title', 'About Us | ALD Motorshop')

@push('styles')
    @vite('resources/css/public/about.css')
@endpush

@section('content')
    <section class="about-section">
        <div class="about-image-wrap">
            <img
                src="https://scontent.fcrk1-2.fna.fbcdn.net/v/t39.30808-6/634750503_1214210287534275_6205258320724220230_n.jpg?stp=dst-jpg_tt6&cstp=mx1537x2048&ctp=p526x296&_nc_cat=108&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeFmD84e8RxZvWgAcJKyZW4eZ1_6ws2wcTxnX_rCzbBxPGPTRfdYG7ks6vL2Drx498HfT2Q-Kk9efxtEzmJ8WMEN&_nc_ohc=lCMUxqr1SQEQ7kNvwF9yVLn&_nc_oc=Adpmx06CiU-Cd2meGu7R2gZhGx3HusObhZh5wU8n4cGz0uQjif1rfwzTPM60xQNKBNg&_nc_zt=23&_nc_ht=scontent.fcrk1-2.fna&_nc_gid=rK1-BxIdC_4xzfwdG-zBqg&_nc_ss=7a2a8&oh=00_AQEjYJ-XyUuahYTvkdUF9b3pfM3I4XzUWlZ3APOrgDcvSw&oe=6A83A0C1"
                alt="ALD Motorshop storefront"
                class="about-image"
            >

            <div class="about-badges" aria-label="ALD Motorshop highlights">
                <span class="about-badge"><i class="fa-solid fa-check" aria-hidden="true"></i>Genuine Motorcycle Parts</span>
                <span class="about-badge"><i class="fa-solid fa-check" aria-hidden="true"></i>Trusted Local Service</span>
                <span class="about-badge"><i class="fa-solid fa-check" aria-hidden="true"></i>Multiple Branches</span>
            </div>
        </div>

        <div class="about-content">
            <p class="about-eyebrow">Who We Are</p>
            <h1>About ALD Motorshop</h1>

            <div class="about-description">
                <p>ALD Motorshop is a motorcycle-parts business offering genuine and compatible parts for Honda, Yamaha, and Suzuki motorcycles. The business also supports riders through motorcycle maintenance, repair services, store pickup, and convenient Lalamove delivery requests.</p>
                <p>The goal of ALD Motorshop is to make dependable motorcycle parts easier to find while giving customers helpful service and convenient ways to receive their orders.</p>
            </div>

            <div class="about-stats">
                <article class="about-stat-card">
                    <i class="fa-solid fa-calendar-check about-stat-icon" aria-hidden="true"></i>
                    <p>4 Years<br>In Business</p>
                </article>

                <article class="about-stat-card">
                    <i class="fa-solid fa-store about-stat-icon" aria-hidden="true"></i>
                    <p>3 Verified<br>Branches</p>
                </article>

                <article class="about-stat-card">
                    <i class="fa-solid fa-motorcycle about-stat-icon" aria-hidden="true"></i>
                    <p>Honda, Yamaha<br>and Suzuki Parts</p>
                </article>

                <article class="about-stat-card">
                    <i class="fa-solid fa-truck about-stat-icon" aria-hidden="true"></i>
                    <p>Pickup and<br>Delivery Available</p>
                </article>
            </div>
        </div>
    </section>
@endsection
