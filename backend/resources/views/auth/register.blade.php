@extends('layouts.auth')

@section('title', 'Create Account | ALD Motorshop')

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

                    <h1>Create your account</h1>
                    <p class="sub">Register for a faster experience while you browse motorcycle parts and submit order requests.</p>

                    <form class="login-form" onsubmit="return false;">
                        <div class="field">
                            <label class="sr-only" for="name">Full name</label>
                            <i class="fa-solid fa-user icon-left" aria-hidden="true"></i>
                            <input id="name" name="name" type="text" placeholder="Full Name" autocomplete="name" required>
                        </div>

                        <div class="field">
                            <label class="sr-only" for="email">Email address</label>
                            <i class="fa-solid fa-envelope icon-left" aria-hidden="true"></i>
                            <input id="email" name="email" type="email" placeholder="Email Address" autocomplete="email" required>
                        </div>

                        <div class="field">
                            <label class="sr-only" for="phone">Contact number</label>
                            <i class="fa-solid fa-phone icon-left" aria-hidden="true"></i>
                            <input id="phone" name="phone" type="tel" placeholder="Contact Number" autocomplete="tel" required>
                        </div>

                        <div class="field">
                            <label class="sr-only" for="password">Password</label>
                            <i class="fa-solid fa-lock icon-left" aria-hidden="true"></i>
                            <input id="password" name="password" type="password" placeholder="Password" autocomplete="new-password" required>
                            <button type="button" class="icon-right" onclick="togglePassword('password', this)" aria-label="Show password">
                                <i class="fa-solid fa-eye" aria-hidden="true"></i>
                            </button>
                        </div>

                        <div class="field">
                            <label class="sr-only" for="password-confirmation">Confirm password</label>
                            <i class="fa-solid fa-lock icon-left" aria-hidden="true"></i>
                            <input id="password-confirmation" name="password_confirmation" type="password" placeholder="Confirm Password" autocomplete="new-password" required>
                            <button type="button" class="icon-right" onclick="togglePassword('password-confirmation', this)" aria-label="Show password">
                                <i class="fa-solid fa-eye" aria-hidden="true"></i>
                            </button>
                        </div>

                        <a href="{{ route('home') }}" class="signin-btn">
                            Create Account
                        </a>
                    </form>

                    <button type="button" class="google-btn">
                        <i class="fa-brands fa-google" aria-hidden="true"></i>
                        Continue with Google
                    </button>

                    <p class="register-line">
                        Already have an account?
                        <a href="{{ route('auth.login') }}" class="register-link">Sign in</a>
                    </p>

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
        function togglePassword(inputId, button) {
            const password = document.getElementById(inputId);
            const isPasswordVisible = password.type === 'text';

            password.type = isPasswordVisible ? 'password' : 'text';
            button.setAttribute('aria-label', isPasswordVisible ? 'Show password' : 'Hide password');
            button.querySelector('i').className = isPasswordVisible
                ? 'fa-solid fa-eye'
                : 'fa-solid fa-eye-slash';
        }
    </script>
@endsection
