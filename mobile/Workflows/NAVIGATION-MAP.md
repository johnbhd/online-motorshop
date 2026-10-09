# Navigation Map

> Confirmed route and navigation relationships for the current customer-only mobile foundation.

## Entry

```text
Expo Router bootstrap
        ↓
Theme + splash composition
        ↓
ALD branded startup overlay
        ↓
AuthProvider session restore in background
        ↓
Customer tab shell
```

- `src/app/_layout.tsx` mounts the provider and tab shell.
- `MobileSplashOverlay` is a temporary overlay owned by the root layout; it dismisses once after the short startup reveal and does not create a back-stack route.
- Session restoration currently reports state through context; it does not redirect or block tabs.

## Public / Authentication Routes

- Sign in: not implemented.
- Register: not implemented.
- Forgot password: not implemented.
- No public auth stack or modal routes exist yet.

## Main Application Routes

```text
Customer tabs
├── /             Home placeholder
├── /products     Products placeholder
├── /cart         Cart placeholder
├── /orders       Orders placeholder
└── /account      Account/session placeholder
```

- `/`: `src/app/index.tsx`.
- `/products`: `src/app/products.tsx`.
- `/cart`: `src/app/cart.tsx`.
- `/orders`: `src/app/orders.tsx`.
- `/account`: `src/app/account.tsx`.

## Legacy / Unlinked Routes

- `/explore`: `src/app/explore.tsx`, retained from the Expo starter and not registered in the customer tab shell.

## Nested Screens / Modals / Parameters

- No nested product details, checkout, order details, modal, sheet, or parameterized route exists.
- No deep-link route beyond the configured `mobile` scheme is implemented.

## Protected and Role-Specific Routes

- No route is currently protected.
- `AuthProvider` rejects non-customer sessions, but the navigation layer does not yet enforce an auth gate.
- Staff/Admin routes are intentionally out of scope.

## Navigation Rules

- Guest users can currently see the shell placeholders.
- Authenticated users receive the same tab shell; account UI can report session state.
- Unauthorized handling is available in the auth context but redirect policy is a follow-up task.
- Back behavior is Expo Router/platform default; no unsaved-form behavior exists.

## Implementation Notes

- Router: Expo Router `~57.0.25`.
- Native implementation: `src/components/app-tabs.tsx` with `expo-router/unstable-native-tabs`.
- Web implementation: `src/components/app-tabs.web.tsx` with `expo-router/ui`.
- Typed routes are enabled in `app.json`.
