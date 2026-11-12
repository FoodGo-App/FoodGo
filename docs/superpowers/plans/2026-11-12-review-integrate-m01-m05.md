# Review and integrate FoodGo M01–M05

> **For agentic workers:** Use superpowers:subagent-driven-development for independent review and superpowers:executing-plans for sequential integration verification.

**Goal:** Review A's feature and integration branches, repair confirmed regressions, and merge only a verified M01–M05 application with existing M03–M05 behavior preserved.

**Architecture:** Reuse integration commit 8972709, which already has a7993b8 and eafeadf as parents. Review its conflict resolutions against both parents, then verify the actual merged tree. Keep the original project, local credentials, production database and A's feature branch intact until validation succeeds.

**Tech Stack:** Expo58 / React Native / TypeScript, Spring Boot4 / Java21, MariaDB / Flyway.

**Spec:** User's request in this chat: review both branches A pushed and integrate suitable work with current M03–M05. Existing docs/M01_M02_HANDOVER.md, docs/INTEGRATION_M01_M05.md and foodgo-backend/docs/M03_M05_VERIFICATION.md provide implementation context, not additional user authorization.

## Constraints and review focus

- No force push, production database reset, edits to applied V1, or stopping user servers.
- Reuse isolated worktree; do not overwrite local config or credentials.
- Validate browse → food/options → cart → address/coupon → checkout → fulfillment → communication, including changed sessions and invalid cart rows.
- Verify migration, test account permissions and seed interactions on isolated schemas before a shared merge.
- Keep automatic pricing, durable retry payloads, chat cursor recovery, UTC and fractional-number validation.
- Record remaining simulated calls/maps/wallet and untested physical-device acceptance accurately.

## Tasks

- [x] Inspect remote branches and ancestry; identify the existing WIP merge and review its integration notes.
- [x] Review FE merge/session/cart/checkout boundaries and BE catalog/cart/seed/test configuration against both parents; record concrete findings with file locations.
- [x] Provision or select isolated test databases with read-only preflight; never repair/reset an existing failed schema implicitly.
- [x] Reproduce each confirmed regression, implement focused fixes and add regression coverage where meaningful.
- [x] Run FE tests, lint, typecheck, exports; run BE tests/migration and actual HTTP flow against isolated MariaDB.
- [x] Perform end-to-end mobile-width browser checks, including add-to-cart and checkout, preserve proof and document limitations.
- [x] Review final diff, commit on a named integration branch and merge verified result into main as authorized; verify remote branch and local handoff without touching A's work.
