@extends('layouts.auth')

@section('title', 'Login | ALD Motorshop')

@push('styles')
    @vite('resources/css/auth.css')
@endpush

@section('content')
    <div class="page">
        <div class="login-panel">
            <div class="login-card">
                <div class="login-image">
                    <img src="{{ asset('img/hero-section.jpg') }}" alt="Motorcycle parts" class="login-hero-img">
                </div>

                <div class="login-content">
                    <img src="{{ asset('img/logo.png') }}" alt="ALD Motorshop logo" class="login-logo-img">

                    <h1>Welcome to ALD Motorshop</h1>
                    <p class="sub">Sign in for a faster experience or continue as a guest to browse products and place an order.</p>

                    <form class="login-form" onsubmit="return false;">
                        <div class="field">
                            <label class="sr-only" for="email">Email address</label>
                            <i class="fa-solid fa-envelope icon-left" aria-hidden="true"></i>
                            <input id="email" name="email" type="email" placeholder="Email Address" autocomplete="email" required>
                        </div>

                        <div class="field">
                            <label class="sr-only" for="password">Password</label>
                            <i class="fa-solid fa-lock icon-left" aria-hidden="true"></i>
                            <input id="password" name="password" type="password" placeholder="Password" autocomplete="current-password" required>
                            <button type="button" class="icon-right" onclick="togglePwd()" aria-label="Show password">
                                <i class="fa-solid fa-eye" aria-hidden="true"></i>
                            </button>
                        </div>

                        <p class="register-line">
                            Don't have an account?
                            <a href="{{ route('auth.register') }}" class="register-link">Register here</a>
                        </p>

                        <a href="{{ route('home') }}" class="signin-btn">
                            Sign In
                        </a>
                    </form>

                    <button type="button" class="google-btn">
                        <i class="fa-brands fa-google" aria-hidden="true"></i>
                        Continue with Google
                    </button>

                    <div class="divider"><hr><span>OR</span><hr></div>

                    <button type="button" class="guest-btn-full">
                        <i class="fa-solid fa-user" aria-hidden="true"></i>
                        Continue as a Guest
                    </button>

                    <p class="footnote">No account needed. Browse products, add items to your cart, and submit an order request immediately.</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        function togglePwd() {
            const password = document.getElementById('password');
            const toggleButton = password.nextElementSibling;
            const isPasswordVisible = password.type === 'text';

            password.type = isPasswordVisible ? 'password' : 'text';
            toggleButton.setAttribute('aria-label', isPasswordVisible ? 'Show password' : 'Hide password');
            toggleButton.querySelector('i').className = isPasswordVisible
                ? 'fa-solid fa-eye'
                : 'fa-solid fa-eye-slash';
        }
    </script>
@endsection
