# Project State

> Concise current snapshot of the mobile application's condition.

## Overall Status

Mobile foundation implemented on 2026-10-09. The app is now an ALD customer shell with a direct Laravel API boundary and SecureStore-backed auth session bootstrap. Business screens remain placeholders.

## Mobile Stack

- React Native `0.86.3`.
- Expo `~57.0.27` / SDK 57 family.
- TypeScript strict mode.
- npm with lockfile v3.
- Expo Router `~57.0.25`.
- Android/iOS Expo configuration; web compatibility retained.

## Screens / Navigation

- Main tabs: `/`, `/products`, `/cart`, `/orders`, `/account`.
- `/explore` remains as an unlinked legacy starter route.
- No login/register route, protected redirect, nested detail route, or modal route exists.

## Authentication

- Laravel auth helpers cover login, register, current-user, and logout contracts.
- `AuthProvider` restores the token from SecureStore and validates it through `/api/auth/me`.
- Customer-role enforcement, unauthorized cleanup, timeout/network errors, and retry-session-restore state are implemented.
- Auth form UI and navigation gating are not implemented.

## Data Integration

- `src/lib/api/client.ts` is a fetch-based direct Laravel JSON client.
- Base URL is expected from public `EXPO_PUBLIC_API_URL`; no real environment value is committed.
- No Firebase, Supabase client, product/order API feature, query cache, or upload flow exists.

## Local Persistence

- `expo-secure-store` persists the bearer token only.
- Cart, product, order, and offline data are not persisted.

## Offline / Network Handling

- Online-first only.
- API timeout, cancellation, network, configuration, and HTTP error categories exist.
- Product/cart/order loading, empty, retry, and offline UI remains future work.

## Device Features / Permissions

- Safe-area context, Expo splash handling, and system theme are used.
- No camera, gallery, location, microphone, contacts, biometric, push, file-picker, or payment-device permission is configured.

## Known UI / Functional / Platform Issues

- Main customer routes are temporary migration screens and do not implement storefront behavior.
- No runtime device or Expo startup verification was completed.
- Full `npm run lint` was attempted but did not complete in this environment; no lint result is claimed.
- No EAS configuration, native folders, application identifiers, release profiles, or test runner exists.

## Current Priority

- Build the first real customer feature slice against the verified Laravel API, beginning with auth screens and navigation gating or the public product catalog, according to product priority.

## Next Likely Work

- Provide development environment configuration for `EXPO_PUBLIC_API_URL`.
- Implement sign-in/register UI and protected/guest navigation behavior.
- Then migrate products using Laravel pagination, image, loading, empty, error, retry, and unauthorized states.

## Scope Boundary

- Backend and frontend were read for migration context only and are not part of the mobile implementation or commit.
