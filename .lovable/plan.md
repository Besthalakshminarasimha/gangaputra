# Full-Stack Hardening & Advanced Features Plan

The app is large (40+ tables, 20+ edge functions). Doing everything in one shot would break things. I'll ship in 4 sequential phases, each verifiable in the preview before moving on.

---

## Phase 1 — Bugs & stability (this turn)

**Confirmed bug from console:** `Dashboard` errors with `PGRST116 — 0 rows` when fetching `profiles`. Some users have no profile row (accounts created before the `handle_new_user` trigger, or trigger failed silently).

Fixes:
1. **Migration**
   - Backfill: `INSERT INTO profiles (id, email, full_name) SELECT id, email, raw_user_meta_data->>'full_name' FROM auth.users WHERE id NOT IN (SELECT id FROM profiles) ON CONFLICT DO NOTHING`.
   - Make `handle_new_user` idempotent with `ON CONFLICT (id) DO NOTHING` so signup never fails.
   - Verify trigger `on_auth_user_created` exists on `auth.users` (recreate if missing).
2. **Frontend**
   - Swap every `.single()` on `profiles` to `.maybeSingle()` and auto-create the row on miss (Dashboard, Profile, anywhere else grep finds).
   - Add a shared `useProfile()` hook so we don't repeat the pattern.
3. **Sweep** — run `tsgo` and dev-server log check, fix any surfaced errors.

## Phase 2 — Backend hardening (next turn)

- Run `supabase--linter` + review RLS on all 40+ tables; add missing GRANTs / policies.
- Run `supabase--slow_queries`; add indexes where obvious (foreign keys on `user_id`, `status`, `created_at` filters that lack them).
- Audit every edge function for: CORS on error paths, input validation with zod, JWT verification where mutations happen.
- Add `updated_at` triggers where missing.

## Phase 3 — Payments go live (turn after)

- Run `recommend_payment_provider`, then enable **Stripe** (built-in seamless) for `orders` and `doctor_appointments` checkout.
- Add `stripe-checkout` + `stripe-webhook` edge functions wired to `orders.status`.
- Order-status emails already exist — hook webhook into them.

## Phase 4 — Advanced features (final turn, all four you selected)

1. **Real-time pond alerts** — new `pond_alerts` table + realtime channel; `powermon_devices` threshold triggers → in-app toast + SMS via existing `send-sms-notification`.
2. **AI crop-cycle co-pilot** — new edge function `crop-cycle-advisor` using Gemini + `crop_cycles` + weather; daily schedule cards on `/farm`.
3. **Outbreak heatmap** — aggregate `diagnosis_history` (anonymized, district-level) into a Leaflet heat layer on `/aquapedia`.
4. **Farmer marketplace + escrow** — extend `sell_crop_requests` with buyer offers table + status machine (`offered → accepted → paid → released`); reuse Stripe from Phase 3 for hold/release.

---

## Technical notes

- No breaking schema changes to existing tables in Phase 1 — only backfill + trigger hardening.
- Every new table gets `GRANT` + RLS + policies + `updated_at` trigger in the same migration.
- Realtime tables added to `supabase_realtime` publication.
- All AI calls use Lovable AI Gateway (`google/gemini-3-flash-preview` default).
- No Web Push (per project memory) — SMS/email/in-app only.

**Approve to start Phase 1.** I will pause after each phase so you can test the preview before I continue.