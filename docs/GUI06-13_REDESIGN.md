# GUI06–13 frontend redesign

Implemented the approved v2 layouts in React Native, retaining FoodGo colors and existing panda assets. No new generated images, dependencies, backend endpoints or database migrations.

- GUI06: eligible offers first, unavailable reasons, automatic price refresh and fixed summary.
- GUI07: stored addresses and address editor, illustrative map and explicit confirmation.
- GUI08: compact order, storefront icon, address/payment/offer selectors and fixed order button.
- GUI09–10: customer waiting/tracking screens, server-controlled actions, details and support in separate views. Cached tracking failures remain visible and hide stale ETA.
- GUI11–13: focused chat composer, rating/tags/comment and call controls. Drafts, retry payloads and account isolation remain intact.

Optional avatar URI fields are rendered when supplied; current backend does not supply them, so initials appear. The map is illustrative, not GPS. Calls remain simulated and transmit no audio.

Browser verification at 390×844 completed using the demo transport: quote 155,000 → TRUA10 → 141,000 without closing the chooser; address selection; placing order FG-863; restaurant acceptance/preparation; driver assignment/pickup/COD completion; customer tracking; sending chat; simulated call connection/end; submitting rating and verifying read-only result. Checkout also inspected at 320px. Found and fixed a pre-existing demo invalidation loop: quote persistence no longer reloads cart resources. Quote persistence and confirmation still work, covered by regression.

Validation: 104 tests passed, TypeScript and ESLint passed; Expo exports for web, Android and iOS succeeded. Screenshots: `output/gui-redesign-review/` in the implementation worktree. Real Android/iOS device keyboard and live API walkthrough were not rerun in this pass; API services and backend payload contracts remain unchanged.

Run the original frontend with `npx expo start -c` and its existing local environment configuration. No Git push was performed for this redesign.
