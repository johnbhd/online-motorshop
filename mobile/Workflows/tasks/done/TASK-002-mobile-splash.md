# TASK-002 — Mobile Branded Splash Screen

## Status

Completed

## Completed

2026-10-09

## Original Goal

Reuse the existing ALD Motorshop frontend logo in the Expo mobile app and implement a short, mobile-native branded startup experience without modifying web or backend behavior.

## Implementation Summary

- Copied the exact frontend logo into the mobile asset bundle.
- Replaced the Expo demo splash overlay with a dark ALD startup overlay.
- Added a restrained opacity/scale logo reveal, loading indicator, accessible labels, safe full-screen layout, and one-time fade dismissal.
- Updated native Expo splash configuration to use the same local ALD logo and dark background.
- Preserved the existing tab route architecture; the splash is a root-layout overlay, so no back-stack route or duplicate navigation is created.

## Files / Areas Changed

- Source asset: `frontend/public/branding/logo.png` → `mobile/assets/images/ald-logo.png`.
- `mobile/src/components/splash-screen.tsx`.
- `mobile/src/app/_layout.tsx`.
- `mobile/app.json`.
- Mobile workflow state/design/navigation/project records.

## Important Technical Decisions

- The frontend original remains unchanged and mobile owns a local runtime copy.
- Built-in React Native `Animated` is used; no animation dependency was added.
- Existing session restoration remains in the background rather than blocking the short splash with a potentially slow network request.
- The overlay uses the existing Expo Router shell rather than restructuring routes into a separate splash stack.

## Verification

- Asset visual inspection: Passed; copied logo matches the frontend logo.
- Asset checksum: Passed; source and mobile copy share the same SHA-256 hash.
- TypeScript: Passed with `npm.cmd exec tsc -- --noEmit`.
- Expo config: Passed with `npm.cmd exec expo -- config --json`; native splash points to `assets/images/ald-logo.png`.
- Web export/compile: Attempted; Metro started but did not complete in this environment and was stopped to avoid leaving a process running.
- Lint: Not run for this task; the project lint command previously did not complete and no lint toolchain is committed.
- Android/iOS device testing: Not run.
- Scope review: Passed; only mobile paths were committed.

## Known Limitations

- The splash has a 1.4-second minimum display duration plus a 260ms fade-out; it does not yet coordinate with future remote bootstrap work.
- No runtime device visual verification was available.
- Final app icon/branding assets remain Expo starter assets.

## Follow-Up

Implement the first real customer screen slice, preferably auth UI/navigation gating or the public product catalog, while preserving the branded startup overlay.

## Git Reference

`b7149a8` — `feat(mobile): add branded splash screen`
