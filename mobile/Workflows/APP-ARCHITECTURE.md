# App Architecture

> Confirmed organization of the current React Native + Expo mobile application.

## Expo / React Native Environment

- React Native: `0.86.3`.
- Expo: `~57.0.27` / SDK 57 dependency family.
- Language: TypeScript with strict settings.
- Package manager: npm, lockfile version 3.
- Android and iOS: configured through Expo; Android is the first product priority.
- Expo Web: configured and retained for compatibility, not a current product target.

## Expo Workflow

- App-config-managed Expo project with no checked-in native `android/` or `ios/` directories.
- No custom native modules or EAS configuration.
- Expo Router and splash-screen plugins are configured in `app.json`.
- `expo-secure-store` is configured as a plugin for session-token persistence.
- Runtime Expo Go/development-build compatibility is not verified.

## Routing / Navigation

- Expo Router `~57.0.25`; React Navigation is not directly configured.
- `src/app/_layout.tsx` owns theme selection, splash overlay, `AuthProvider`, and the tab shell.
- Native tabs are in `src/components/app-tabs.tsx`; web tabs are in `app-tabs.web.tsx`.
- Main routes: `/`, `/products`, `/cart`, `/orders`, `/account`.
- `/explore` is an unlinked legacy starter route.
- No protected route redirect or login/register screen exists yet.

## Folder Architecture

- `src/app/`: Expo Router route files.
- `src/components/`: shared themed primitives, splash UI, tab shells, auth provider, and temporary mobile screen.
- `src/constants/`: theme palette and spacing values.
- `src/hooks/`: color-scheme and theme hooks retained from the Expo foundation.
- `src/lib/api/`: centralized fetch-based API client.
- `src/lib/auth/`: Laravel auth contracts, API calls, SecureStore token persistence, and provider.
- `assets/`: Expo icon, splash, and starter assets.

## Screen Architecture

- The five main routes currently render a safe-area temporary migration shell.
- `account.tsx` reads session state and exposes restore/sign-in/sign-out status text only; it is not an auth form.
- Product, cart, and order routes do not fetch or mutate business data yet.

## Component Architecture

- The existing Expo themed primitives remain the shared presentation base.
- `MobileScreen` provides the intentionally minimal ALD-branded placeholder shell.
- `AuthProvider` is the only app-wide provider introduced so far.
- No UI kit, NativeWind, feature component library, or web-component reuse is present.

## State Architecture

- Local/UI state: route presentation and React context state.
- Shared client state: `AuthProvider` stores `user`, restore status, and auth errors in React context.
- Server state: no product/order query cache or remote data store exists.
- Persisted state: only the Laravel bearer token is persisted in SecureStore.

## Data Layer

- `src/lib/api/client.ts` is the single request boundary and reads `EXPO_PUBLIC_API_URL`.
- `src/lib/auth/api.ts` maps the currently verified Laravel auth endpoints.
- Laravel JSON responses and validation/error payloads remain authoritative.
- No Firebase, Supabase client, GraphQL client, Axios, or query library is installed.

## Authentication Architecture

- `AuthProvider` restores the SecureStore token on mount and validates it with `GET /api/auth/me`.
- Login/register API helpers store the returned bearer token and validate the returned customer session.
- Logout calls Laravel best-effort, then clears local token state.
- Missing/invalid configuration, network/timeout, validation, unauthorized, and non-customer errors are surfaced as user-readable provider errors.
- Navigation is not yet gated; auth UI and redirect policy are a follow-up task.

## Persistence

- Library: `expo-secure-store`.
- Key: an internal mobile auth-token key; the raw token is never written to normal app storage.
- Cart, orders, product data, and offline cache are not persisted.

## Networking

- Native `fetch` with JSON headers, bearer-token injection, 15-second timeout, abort-signal composition, JSON/text parsing, and typed `ApiError` categories.
- Public configuration is limited to `EXPO_PUBLIC_API_URL`; no private server credential is accepted by the client.

## Device Integrations

- Safe-area context and Expo splash handling are used.
- No camera, gallery, location, microphone, contacts, biometrics, push notification, file-picker, or payment-device permission is configured.

## Error Handling and Logging

- API errors normalize configuration, network, timeout, cancellation, and HTTP failures.
- Auth provider maps common Laravel statuses including 401, 403, and 422 into UI-safe messages.
- Tokens, passwords, and private customer data are not logged.

## Offline Strategy

- Online-first only. No cache, queue, retry policy, or background sync exists beyond request timeout and explicit caller retry/session-restore retry.

## Platform Differences

- Android: native tab implementation; first product priority.
- iOS: same route and component architecture through Expo; runtime verification pending.
- Web: platform-specific tab implementation retained for technical compatibility.

## Build / Release Strategy

- Development scripts are `start`, `android`, `ios`, `web`, `lint`, and the template reset script.
- No Jest, Detox, Maestro, EAS, APK/AAB, iOS archive, package identifier, or release profile is configured.

## Important Constraints

- Keep backend and frontend untouched during mobile migration work.
- Do not add a state/query library without a concrete feature requirement.
- Keep Laravel authoritative and keep all server/admin/payment secrets out of the mobile bundle.
- Do not claim product screens are implemented while they are placeholders.
