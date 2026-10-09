# Project

> Confirmed mobile project state. Backend and web frontend remain outside this app's implementation scope.

## Application Overview

- Project name: ALD Motorshop Mobile.
- Purpose: customer-facing React Native/Expo migration client for the existing Laravel motorshop.
- Current scope: a customer navigation shell, direct Laravel API boundary, and Sanctum session bootstrap. Product workflows are still placeholders.
- Laravel remains authoritative for authentication, validation, inventory, prices, totals, ownership, and order lifecycle.

## Target Users and Platforms

- Intended users: guest customers and registered customers.
- Staff/Admin workflows are intentionally excluded from this mobile app.
- Android is the first product priority; iOS remains supported by Expo configuration; web files are retained for technical compatibility and are not the product target.

## Confirmed Mobile Stack

- React Native `0.86.3`.
- Expo `~57.0.27` / SDK 57 dependency family.
- TypeScript with strict compiler settings.
- npm with lockfile version 3.
- Expo Router `~57.0.25` with file-based routing.
- Native tabs use `expo-router/unstable-native-tabs`; web uses `expo-router/ui`.
- React Native `StyleSheet` and shared theme constants; no UI framework or state library.

## Implemented Foundation

- `src/app/_layout.tsx` mounts the theme/splash composition and `AuthProvider`.
- `src/components/splash-screen.tsx` provides the ALD branded React Native startup overlay with the copied logo, restrained reveal, loading indicator, and timed dismissal.
- Main customer shell routes are `/`, `/products`, `/cart`, `/orders`, and `/account`.
- `/explore` remains as an unlinked legacy Expo starter route until cleanup is scheduled.
- `src/lib/api/client.ts` provides a fetch-based JSON client with public `EXPO_PUBLIC_API_URL`, bearer-token support, timeout, cancellation, and normalized HTTP/network errors.
- `src/lib/auth/` provides Laravel login/register/me/logout contracts and SecureStore-backed token helpers.
- `AuthProvider` restores and validates a customer session through `/api/auth/me`; non-customer roles are rejected.
- Product, cart, and order screens are explicitly temporary migration placeholders; no product feature is claimed as complete.

## Data and Security Boundary

- Mobile talks directly to the Laravel REST API; it does not access Supabase/PostgreSQL directly and does not copy the Next.js BFF.
- `expo-secure-store` is used for the bearer token. Passwords and tokens are not logged.
- No Firebase, Supabase client, admin secret, payment secret, or server credential is in mobile code.
- No offline cache, background sync, device permission, or upload workflow is implemented.

## Device / Build Status

- Safe areas, Expo splash handling, and light/dark theme selection remain configured.
- Native Expo splash configuration now uses the copied ALD logo on the dark ALD background; the React Native overlay remains the short branded startup experience.
- No checked-in native `android/` or `ios/` directories, EAS configuration, release profile, or test runner exists.
- TypeScript verification passed. Full lint was attempted but the Expo lint command did not complete in this environment; no runtime device verification was performed.

## Remaining Product Work

- Configure a real public `EXPO_PUBLIC_API_URL` per environment.
- Build customer auth screens and protected navigation behavior.
- Migrate products, product details, cart, checkout/order requests, tracking, orders, and account screens incrementally from the web/API contracts.
- Decide guest cart persistence, offline expectations, upload/device capabilities, branding assets, and release strategy.
