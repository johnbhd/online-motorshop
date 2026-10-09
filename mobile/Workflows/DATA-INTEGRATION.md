# Data Integration

> Confirmed mobile data boundary. Laravel is authoritative; backend and web frontend are read-only references for this mobile work.

## Data Source

- The mobile client communicates directly with the sibling Laravel JSON API.
- Supabase PostgreSQL remains behind Laravel and is not accessed directly.
- The Next.js frontend/BFF is a migration reference, not a mobile runtime dependency.

## API Client

- Location: `src/lib/api/client.ts`.
- Transport: native `fetch`.
- Base URL: public `EXPO_PUBLIC_API_URL`, with trailing slash normalization.
- Features: JSON request/response handling, bearer-token injection, 15-second timeout, abort-signal support, and typed configuration/network/timeout/cancellation/HTTP errors.
- The app currently has no product/order query cache, polling, subscriptions, or upload client.

## Authentication Integration

- Provider: Laravel Sanctum bearer-token API; no Firebase Auth or Supabase Auth.
- API mapping: `src/lib/auth/api.ts`.
- Session state: `src/components/auth/AuthProvider.tsx`.
- Current endpoints used:
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `GET /api/auth/me`
  - `POST /api/auth/logout`
- The provider requires a customer role, clears invalid/unauthorized sessions, and exposes restore/error/retry state.

## Token / Persistence Strategy

- Token storage: `expo-secure-store` through `src/lib/auth/storage.ts`.
- The client stores only the bearer token; passwords and private credentials are never persisted or logged.
- SecureStore availability is checked; no fallback to unencrypted storage is used.

## Laravel Contracts Relevant to Future Migration

- Public resources verified in the sibling API include `/api/products`, `/api/products/{identifier}`, `/api/categories`, `/api/branches`, and `/api/payment-instructions`.
- Customer/order resources include `POST /api/order-requests`, `POST /api/order-requests/track`, `/api/customer/orders`, `/api/customer/orders/{reference}`, payment-proof routes, and customer notification routes.
- Product and order pagination uses Laravel `meta` fields where applicable.
- Validation commonly returns HTTP 422 with `message` and `errors`; the mobile client exposes the payload through `ApiError`.
- These endpoints are documented for migration planning only; no product/order screen consumes them yet.

## Environment Configuration

- No mobile `.env*` file or real API URL is committed.
- Only the public Laravel origin may be exposed through `EXPO_PUBLIC_API_URL`.
- Laravel, database, Supabase service-role, payment, and admin secrets must remain server-side.

## Firebase / Other Services

- Firebase: none.
- Supabase client: none.
- GraphQL/Axios/query library: none.
- No push, analytics, storage, or payment provider is integrated.

## Loading, Errors, and Offline Behavior

- Auth restoration has loading, unauthorized, network/timeout, configuration, validation, and retry states.
- Product/cart/order data has no loading, empty, retry, or offline UI yet because those features are placeholders.
- The app is online-first. No offline cache, queue, background sync, or conflict policy exists.

## Security Constraints

- Laravel remains authoritative for authorization, validation, prices, totals, ownership, and order lifecycle.
- Client-side checks are UX only and must not replace Laravel validation.
- Never log bearer tokens, passwords, private customer data, or server secrets.
