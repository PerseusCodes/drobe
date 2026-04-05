# Drobe — MVP Scope and Milestones

**Date:** 2026-04-05  
**Status:** Proposed — awaiting Marko review  
**Phase:** 1 — Architecture & Planning  
**Author:** Product Strategist agent

---

## Context

The prototype is a working Vite + React SPA deployed at Vercel with all five core pages built (Today, Closet, Scan, Outfits, Declutter, Profile). Every feature is functional — the gap is entirely in the data layer: localStorage limits images to ~20–50 KB each, there is no auth, and no cross-device sync. The rebuild goal is to wire this existing UI to a real backend and get a phone-testable URL in the hands of real users as fast as possible.

The prototype is an asset, not a liability. We keep it and evolve it — we do not throw it away.

---

## 1 — Build-Now vs Defer Table

| Feature | Decision | Reason |
|---|---|---|
| **Auth** (email + magic link + Google OAuth) | **Build now** | Required for per-user data; RLS won't work without it |
| **Supabase schema** (garments, outfits, outfit_items, wear_events) | **Build now** | Foundation for everything; already designed in ADR-003 |
| **Supabase Storage** (images, private bucket, signed URLs) | **Build now** | Replaces localStorage data-URIs; unblocks real photos |
| **useWardrobe → TanStack Query + Supabase SDK** | **Build now** | Core data migration; existing hook is the boundary to replace |
| **Canvas resize before upload** | **Build now** | Already exists in prototype; keep it, just change the upload target |
| **Tesseract.js care label OCR** | **Build now** | Already works; zero additional cost; no reason to defer |
| **Rule-based outfit engine** | **Build now** | Already works; no backend needed |
| **PWA manifest + install prompt** | **Build now** | Already configured via vite-plugin-pwa; just verify on real device |
| **Vercel deploy + env vars** | **Build now** | Already deployed; add Supabase env vars |
| **Today page, Closet, Scan, Outfits, Declutter, Profile UI** | **Build now (keep)** | All pages built; wire to real data layer |
| **Apple Sign-In** | **Defer to Phase 2** | Needs $99 Apple Developer account; only required for App Store submission |
| **Workbox BackgroundSync (offline writes)** | **Defer to Phase 2** | Adds complexity; online-first is fine for MVP validation |
| **Supabase Realtime multi-device sync** | **Defer to Phase 2** | Nice-to-have; TanStack Query cache is sufficient for single-user testing |
| **Background removal (rembg / remove.bg)** | **Defer to Phase 2** | Not core value; no user feedback yet to justify cost or ops |
| **Capacitor iOS/Android wrappers** | **Defer to Phase 2** | PWA is sufficient for real-device testing and user interviews |
| **Claude Haiku vision for OCR** | **Defer to Phase 2** | Tesseract.js works; upgrade only if accuracy is a validated pain point |
| **Tailwind CSS migration** | **Defer to Phase 2** | Existing CSS works; refactoring now is pure churn |
| **AI outfit recommendations** | **Defer to Phase 3** | Requires sufficient garment data to be useful; premature without users |
| **Weather / calendar integration** | **Defer to Phase 3** | Nice differentiator; not core value at MVP |
| **Packing assistant** | **Defer to Phase 3** | High effort, niche initial use case |
| **Thumbnail generation** | **Defer to Phase 2** | Storage path already reserved in schema; add when image volume matters |
| **Push notifications** | **Defer to Phase 2** | Requires Capacitor or web push setup; no retention hooks needed yet |
| **Export/import JSON backup** | **Keep in Profile (already built)** | Zero cost to keep; useful safety net while backend is new |

---

## 2 — MVP Success Criteria

The MVP is validated when **all of the following are true**:

1. **Auth works end-to-end on a real phone.** A new user can sign up via email or Google, close the browser tab, return, and their session persists.

2. **Add a garment from phone camera to visible closet in under 60 seconds.** Photo → resize → upload → form fill → save → appears in Closet grid. No data-URI. Photo survives a hard refresh.

3. **Data survives a full browser reset.** Clear cache, reopen the Vercel URL, log in — all garments and outfits are still there.

4. **Outfit generation works with real Supabase-backed data.** Outfits are saved to the database, not localStorage.

5. **Wear logging writes a `wear_events` row.** Verifiable in Supabase dashboard.

6. **Declutter page reflects real wear history** derived from `wear_events` (not a stale counter).

7. **Installable as PWA on iOS (Safari "Add to Home Screen") and Android (Chrome install prompt).** App icon and splash screen display correctly.

8. **One other person can create an account and see only their own data** (RLS enforcement confirmed).

9. **Total operational cost remains $0** (within Supabase and Vercel free tiers).

---

## 3 — First Implementation Milestone: "Auth + Data Foundation"

**Goal:** Replace localStorage with Supabase. Everything else in the app stays the same — same pages, same UI, same outfit engine. Only the data layer changes.

**Deliverables:**

| # | Deliverable | Done when… |
|---|---|---|
| 1 | Supabase project created (`drobe-dev`) | Project URL and anon key exist |
| 2 | SQL migration files written for all four tables (garments, outfits, outfit_items, wear_events) | `supabase/migrations/001_initial_schema.sql` committed |
| 3 | RLS policies written and enabled on all tables | Another user cannot read your garments |
| 4 | Supabase Auth configured: email, magic link, Google OAuth | Sign-up and sign-in work in browser |
| 5 | Auth gate in app: unauthenticated users see sign-in screen | Accessing the Vercel URL without a session shows auth UI |
| 6 | `useWardrobe.ts` replaced with TanStack Query hooks backed by Supabase SDK | `useGarments()`, `useAddGarment()`, `useOutfits()`, `useSaveOutfit()`, `useLogWear()` |
| 7 | Image upload: Canvas resize → Supabase Storage (private bucket) → `image_path` stored on garment row | Garment photo loads from signed URL, not data-URI |
| 8 | Wear log writes a `wear_events` row | Visible in Supabase table editor |
| 9 | Vercel env vars set: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Production deploy works without local `.env` |
| 10 | Real-device smoke test: add item, view closet, log wear, hard refresh — data persists | Tested on one iOS and one Android device |

**Scope boundary — what this milestone does NOT include:**
- No background removal
- No Realtime subscriptions
- No offline write queue
- No Capacitor
- No Tailwind
- No Apple Sign-In
- No AI features

**Risk:** The biggest risk is the `useWardrobe` migration. The hook is used across all six pages with a shared `items` array and imperative mutation functions. Replacing it with TanStack Query requires threading async loading states and error states into every consumer. Plan for a brief period where the UI needs loading/error handling added. This is unavoidable and should be done page-by-page, not all at once.

---

## 4 — Recommended Sequence After Milestone 1

Once Milestone 1 passes its success criteria and Marko approves:

### Milestone 2 — Polish & Offline Reads (~1 week)
- Add TanStack Query cache persistence to IndexedDB (offline read support)
- Add loading skeletons and empty states to all pages (currently shows blank)
- Add optimistic updates to Add Garment and Log Wear (instant UI feedback)
- Verify PWA install flow on real iOS and Android — fix any manifest/icon issues
- Add `supabase/migrations/` to CI: schema migrations run before Vercel build

### Milestone 3 — Image Pipeline Upgrade (~1 week)
- Deploy rembg microservice on Fly.io (Python, `rembg` library, ~256 MB)
- Async background removal: upload → trigger → Supabase Realtime notifies client when `processed.jpg` ready
- Client shows original photo until processed version is ready (graceful fallback)
- Thumbnail generation: 400px JPEG written to `thumb.jpg` path at upload time

### Milestone 4 — Capacitor Wrapper (~3–4 days)
- Add Capacitor to the Vite project
- Configure iOS and Android targets
- Add native camera plugin (replaces `<input type="file">` — better UX, better quality)
- Build `.ipa` and `.apk` for TestFlight / internal Play Store track
- Add Apple Sign-In (needed for App Store; requires Apple Developer account)

### Milestone 5 — Phase 2 AI Features (after user validation)
- Upgrade care label OCR to Claude Haiku vision (behind API route, not client-side)
- AI outfit suggestions: Claude Haiku with garment embeddings — only after ≥20 garments per user
- Weather-based Today suggestions (OpenWeatherMap, free tier)

---

## Product Risks and Assumptions

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| localStorage → Supabase migration touches every page — longer than estimated | Medium | Medium | Migrate `useWardrobe` first as a single abstraction boundary; pages don't know the data source |
| Tesseract.js OCR quality degrades on low-contrast labels | Medium | Low | Already handled in prototype; defer to Haiku vision only if user feedback confirms it |
| Supabase free tier storage fills quickly for early testers with many photos | Low | Low | Canvas resize keeps uploads at ~100–300 KB; 1 GB = 3,000–10,000 photos |
| Users expect background removal immediately | Medium | Medium | Set expectation clearly: "background removal coming soon" label on garment cards |
| PWA install UX on iOS is unintuitive (requires manual "Add to Home Screen") | High | Medium | Add an in-app install prompt banner with Safari instructions |
| RLS misconfiguration leaks data between users | Low | High | Write RLS test queries in migration files; verify in Supabase dashboard before any beta invite |

---

*Prepared by: Product Strategist agent | Requires Marko review before Phase 2 begins*
