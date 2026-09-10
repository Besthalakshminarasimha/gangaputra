# GANGAPUTRA farmer-first platform upgrade plan

## Goal

Transform the existing GANGAPUTRA app into a focused aquaculture operating system without rebuilding or removing working features. The primary farmer journey will become:

```text
Farm → Pond → Crop → Water → Feed → Health → Weather → Market → Sell → Profit
```

## Delivery phases

### Phase 1 — Farmer-first information architecture and live dashboard
- Preserve all existing routes and feature pages.
- Reframe `/dashboard` as the daily operating view: greeting, farm status, active crop, data-backed priorities, water status, weather, market, profit snapshot, and quick actions.
- Remove hardcoded crop progress, alarm, environmental, and score values from the primary dashboard; show clear “Data unavailable” states when records do not exist.
- Reuse the current farm, crop-cycle, weather, shrimp-rate, fish-rate, sell, finance, notification, health, and AI components.
- Simplify navigation into Home, My Farm, Crop, Market, Health, Store, Sell, and More while keeping existing URLs available.
- Label market values by verified, estimated, forecast, or unavailable status based on the actual source.

### Phase 2 — My Farm, ponds, and daily records
- Add only the missing tables needed for individual ponds, persistent water-quality logs, and daily farm logs.
- Apply owner-scoped RLS, explicit grants, indexes, timestamps, and safe foreign keys in the same migrations.
- Build mobile-first My Farm views for farms, ponds, water, feed, health observations, notes, alerts, and crop history.
- Replace simulated sensor values with honest manual-entry and unavailable states until a real device integration is present.
- Keep current farm creation and PowerMon functionality working.

### Phase 3 — Crop operations, score, and passport
- Extend the existing crop-cycle workflow rather than creating a duplicate crop table.
- Add stocking, target harvest, production, FCR, survival, and completion data only where the current schema lacks fields.
- Build a crop timeline and harvest/profit summary from user-entered records.
- Calculate Farm Score only from available records; explain strengths, missing records, and attention areas.
- Generate a unique farm/pond passport identity and QR share view with privacy-safe authorization.

### Phase 4 — Trust, AI, market, and supporting modules
- Reposition existing AI tools as assistance and screening, never definitive diagnosis or fabricated recommendations.
- Add source, updated time, confidence, and status labels to weather, market, AI, product, and expert surfaces.
- Connect Sell My Crop, Store recommendations, P&L, experts, notifications, compliance, traceability, community, hatcheries, jobs, and finance to the core farm workflow where current data supports it.
- Preserve current admin controls and add focused verification/moderation views only where existing data supports them.
- Keep regional-language and voice support focused on useful farmer actions, especially Telugu.

### Phase 5 — Validation and hardening
- Run typecheck/build and inspect browser console and network behavior.
- Verify signed-out redirects, owner isolation, RLS behavior, existing edge functions, storage, auth, and existing routes.
- Check mobile and desktop layouts, loading/error/empty states, and reduced-motion behavior.
- Fix regressions found during verification; do not add unrelated features.

## Technical approach

- Use existing React, shadcn, Tailwind tokens, Supabase client, tables, edge functions, and component patterns.
- Inspect every existing table before schema changes; do not create duplicates.
- Use migrations for schema changes only, with GRANTs before RLS policies for every new public table.
- Keep all new user data scoped by authenticated user ownership.
- Keep AI calls and secrets server-side; use existing integrations and display honest fallbacks.
- Implement Phase 1 first, verify it, then continue phase-by-phase.

## Out of scope

- Rebuilding the application from scratch.
- Removing existing pages, APIs, tables, authentication, AI features, or integrations.
- Fabricating measurements, prices, weather, credentials, approvals, diagnoses, scores, or financial values.
- Adding unsupported IoT, payment, or notification capabilities without a real integration.
