# Mobile Design System

> Current confirmed foundation tokens and interaction conventions. This is not a completed product design system.

## Visual Direction

- Temporary ALD Motorshop shell: near-black/navy surfaces with orange-gold primary accent and restrained neutral copy.
- Product screens remain intentionally unbuilt; do not infer final storefront styling from the placeholder shell.

## Color System

- Light background: `#F8FAFC`.
- Light surface: `#FFFFFF`.
- Light text: `#0B1930`.
- Light secondary/muted text: `#607080`.
- Light selected surface: `#FFF1E6`.
- Dark background: `#07111F`.
- Dark surface: `#122238`.
- Dark text: `#F8FAFC`.
- Dark secondary/muted text: `#AEBAC8`.
- Dark selected surface: `#2E1D0D`.
- Primary accent: light `#C96A00`; dark `#F08A24`.
- Error, success, warning, and border roles are not yet standardized.

## Typography / Spacing

- Platform system fonts are used; no custom font is loaded.
- Existing `ThemedText` variants provide title, subtitle, body, small, link, and code roles.
- Confirmed spacing values include `2`, `4`, `8`, `16`, `24`, `32`, and `64`.
- Final ALD type scale, radius scale, and elevation scale are not confirmed.

## Components and Interaction

- `MobileScreen` is the current temporary safe-area/scrollable shell.
- Existing Expo themed primitives remain available.
- No product buttons, forms, cards, lists, bottom sheets, modals, or upload controls are implemented.
- No UI framework or web CSS has been copied into mobile.

## Headers / Tabs

- Customer shell tabs: Home, Products, Cart, Orders, Account.
- Native tabs use Expo Router native tabs; web uses the platform-specific Expo Router UI tabs.
- Final tab icon set is not established; current shell uses text labels.

## Loading / Empty / Error / Offline

- Auth context has restore and error states.
- Product/cart/order loading, empty, error, disabled, unauthorized, and offline states remain future feature requirements.
- No offline cache or retry UI exists outside session-restore retry.

## Safe Area / Keyboard / Touch

- Safe-area handling is required and used by the temporary shell.
- Keyboard behavior is not yet established because no form screen exists.
- Touch-target, focus, screen-reader, contrast, dynamic-text, and announcement conventions need a feature-level accessibility pass.

## Dark Mode

- Theme follows the system color scheme through Expo Router's theme provider.
- The current palette provides light and dark foundation values; final customer dark-mode behavior is not product-approved.

## Platform Differences

- Android: first product target and native tab implementation.
- iOS: shared Expo components and system fonts; runtime behavior unverified.
- Web: compatibility tab implementation retained but not a product target.
