# Drobe — Phase Plan

**Date:** 2026-04-05
**Author:** CEO Orchestrator
**Status:** Awaiting Marko approval before Phase 2 begins

---

## What Exists and Its Quality

The prototype is a working Vite + React 19 SPA with six pages (Today, Closet, Scan, Outfits, Declutter, Profile), TypeScript types, and a solid CSS token system. Quality is high for a prototype — the code is clean, the component boundaries are sensible, and the visual direction is correct.

**What works well:**
- Data model (ClothingItem, Outfit) is well-structured and covers most required fields
- Care label OCR via Tesseract.js is functional, handles fabric aliases in five languages
- HSL colour detection runs client-side with no external dependency
- Rule-based outfit engine (top+bottom+shoe combos, season/occasion filtering) produces useful results
- Declutter candidates and wardrobe gap analysis are built and working
- CSS token system (warm linen palette, spacing scale, radius scale, shadow scale) is production-quality
- PWA config (vite-plugin-pwa) is in place

**What is missing or broken:**
- All data is in localStorage — images as data-URIs, hard quota limit at ~20–50 KB per photo on real use
- No auth — no user identity, no per-user data, no sync
- Data is lost on browser reset or device change
- No loading states — the app will show blank screens once Supabase async data replaces localStorage
- No error states — network/auth failures are invisible to the user
- Outfit engine has no AI input; no weather, no colour harmony scoring, no occasion context beyond hardcoded rules
- No background removal — photos carry real-world clutter (floors, hangers)
- No onboarding walkthrough
- Season detection is date-based, not location/IP-based
- No public wardrobe sharing
- No packing use case
- No photo tips (Zara-style framing guidance)
- Wardrobe score is trivially computed (% items worn at least once) — not a real gap analysis
- Declutter has Keep/Remove buttons but no swipe gesture despite instructional copy saying to swipe
- Profile page has gamification chrome (membership levels, avatar) that doesn't connect to anything real yet

**Architecture documents already produced (Phase 1):**
- `docs/adr-phase1-system-architecture.md` — ADR covering backend (Supabase), auth, schema, image pipeline, sync, deployment. Decisions are sound.
- `docs/mvp-scope-and-milestones.md` — Build-now vs defer table, success criteria, milestone breakdown. Actionable and complete.
- `docs/ui-direction-and-cleanup.md` — Keep/change/remove audit, visual system rules, 10-item pre-Milestone-1 cleanup list, UI risk register.

These three documents are high quality. The planning work is done. What remains is execution.

---

## Prioritised Phase Plan

### Phase 1 (NOW) — Pre-build cleanup + data foundation
**Goal:** Clean up the UI to prevent debt compounding, then replace localStorage with Supabase. Same UI, same pages, real backend.

**1A — UI Cleanup (do first, ~half a day)**
All 10 items from `ui-direction-and-cleanup.md` section 4. The blocking ones:
1. Replace gradient on `btn-primary` with flat `var(--accent)`
2. Fix nav active state — remove `translateY(-8px)` + gradient, add 3px dot indicator
3. Add `.page-title` CSS class, apply to all page h1s (stops typography drift)
4. Remove salmon stat card background (`--secondary-bg`) — replace with `var(--bg-card)`
5. Fix DROBE wordmark colour to `var(--text-bright)`
6. Remove Profile gamification section (membership banner, avatar edit badge, wardrobe level)
7. Fix declutter stat label colour (accessibility issue — near-invisible against background)
8. Remove "Swipe right if it sparks joy" copy from DeclutterPage
9. Remove "DROBE v1.0 — All data stored locally" from ProfilePage
10. Add `.skeleton` and `.error-banner` CSS classes (required before async data lands)

**1B — Auth + Data Foundation (~1 week)**
Per the milestones doc, Milestone 1 deliverables:
- Supabase project created (`drobe-dev`)
- SQL migration: `garments`, `outfits`, `outfit_items`, `wear_events` tables with RLS
- Supabase Auth: email, magic link, Google OAuth (Apple Sign-In deferred — needs $99 Dev account)
- Auth gate: unauthenticated users see sign-in screen built with the app's own token system
- Replace `useWardrobe.ts` with TanStack Query hooks (`useGarments`, `useAddGarment`, `useOutfits`, `useSaveOutfit`, `useLogWear`) backed by Supabase SDK
- Image upload: Canvas resize → Supabase Storage private bucket → `image_path` on garment row
- Wear log writes `wear_events` row (not a counter patch)
- Vercel env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Real-device smoke test (one iOS, one Android) — data survives hard refresh

**Phase 1 success criteria (from milestones doc):**
- User signs up on real phone, closes tab, returns — session persists
- Photo to closet in under 60 seconds, survives hard refresh
- One other person creates an account and sees only their own data (RLS confirmed)
- Total cost: $0 (within Supabase + Vercel free tiers)

---

### Phase 2 — Polish, offline reads, image pipeline, native wrapper
**Goal:** Raise quality to a level suitable for wider beta. No new core features — make existing features feel finished.

**2A — UI polish and offline reads (~1 week)**
- Loading skeletons on all pages (item grid, outfit list, stat cards)
- Optimistic updates on Add Garment and Log Wear (instant UI feedback before server round-trip)
- TanStack Query cache persisted to IndexedDB (offline read support — browse closet without signal)
- Error banners on all pages (network failure, upload failure, auth expiry)
- PWA install prompt on iOS (detect `window.navigator.standalone`, show Share-sheet instruction card)
- Supabase migrations wired into Vercel CI (`supabase db push` before build)

**2B — Image pipeline (~1 week)**
- Deploy `rembg` Python microservice on Fly.io (~256 MB, ~$2/month)
- Async background removal: upload → trigger processing → Supabase Realtime notifies client when `processed.jpg` ready
- Client shows original photo until processed version ready (no blocking spinner)
- Thumbnail generation: 400px JPEG at upload time
- OCR upgrade: move care label scanning to a server-side API route using Claude Haiku vision (behind Supabase Edge Function or Vercel serverless) — only if Tesseract accuracy is a validated user complaint

**2C — Native wrapper (~3–4 days)**
- Add Capacitor to the Vite project
- Native camera plugin (replaces `<input type="file">` — better quality, better framing)
- Build `.ipa` for TestFlight and `.apk` for internal Play Store track
- Apple Sign-In (required for App Store submission — needs Apple Developer account)
- Push notifications via Capacitor + FCM/APNS (outfit reminder, wear tracking nudge)

**2D — Swipe gesture on Declutter**
- Add touch event handler or `@use-gesture/react` to DeclutterPage
- Swipe right = Keep, swipe left = Remove
- Spring physics on card (optional but on-brand)

---

### Phase 3 — AI features, wardrobe intelligence, social
**Goal:** Differentiate the product. AI features only make sense once users have ≥20 garments in the system.

**3A — AI outfit recommendations**
- Claude Haiku vision + garment embeddings: recommend outfits based on weather, occasion, and colour harmony
- Weather input: OpenWeatherMap free tier — current conditions feed Today page
- Calendar integration: suggest outfits for upcoming events (Google Calendar OAuth)
- Colour harmony scoring in outfit engine (replace the current neutral-goes-with-everything approximation)
- Season detection from location/IP (replace current date-based approximation)

**3B — Real wardrobe score + gap analysis**
- Replace trivial "% worn at least once" score with a weighted algorithm:
  - Utilisation rate (wear frequency per item)
  - Occasion coverage (do you have something for every occasion type?)
  - Season coverage
  - Category balance (accessories and shoes weighted, not just tops/bottoms)
  - Colour palette coherence
- Actionable gap recommendations: "You have no formal shoes — 3 saved formal outfits can't be completed"

**3C — Public wardrobes**
- Per-user public profile toggle
- Shareable link: `drobe.app/u/{username}`
- Visible items only (user controls what's public)
- No social features beyond view-only (no follows, no likes at this stage)

**3D — Packing assistant**
- Trip input: destination, dates, occasion mix
- Suggests items from existing closet that cover the occasion + weather mix
- Output: packing list with outfit previews
- Tie into calendar integration from 3A

**3E — Photo tips (Zara-style)**
- In-app framing guide on ScanPage step 1
- Overlay: recommended crop lines, lighting tip, "hang it flat or lay it on white surface"
- One-sentence contextual tip based on category (shoes need different guidance than tops)

**3F — Onboarding walkthrough**
- First-launch flow: 3–4 screens explaining core value, how to scan, what the wardrobe score means
- Trigger: only shown on first auth, dismissed permanently
- Reachable again from Profile → "How it works"

---

### Phase 4 — Scale and monetisation
Activate standby agents (marketing-pod, business-finance-pod) when ready.

- Supabase Pro upgrade when free tier is approached
- Capacitor App Store submission (iOS App Store, Google Play)
- Pricing model decision: freemium (item limit), subscription (AI features gate), or one-time purchase
- ASO (App Store optimisation)
- ElectricSQL local-first sync if offline-first becomes a validated hard requirement from users
- React Native migration only if Capacitor WebView performance is a confirmed user problem

---

## Architecture Decisions That Need Perseus Before Building

The ADR and milestones documents are thorough. These are the remaining open questions before Phase 1B implementation begins:

**1. Supabase project naming and environment split**
The ADR proposes `drobe-dev` and `drobe-prod` as separate Supabase projects. Confirm: should `drobe-dev` be created now, or go straight to a single `drobe-prod` given it's still pre-users? Separate projects mean separate migration runs; a single project with environment branches is simpler but mixes dev traffic with production data.

**2. `timesWorn` on the garment row vs computed from `wear_events`**
The ADR correctly identifies `wear_events` as the source of truth. But the current TypeScript `ClothingItem` type has `timesWorn: number` and `lastWorn?: string` as first-class fields. Decision needed: do we keep these as cached denormalised columns on the `garments` row (updated via trigger or app logic) for query simplicity, or remove them entirely and always compute from `wear_events` joins? Triggers in Supabase are Postgres functions — low complexity but adds migration surface area.

**3. Supabase Edge Functions vs Vercel API Routes for server-side work**
Phase 2 care label OCR upgrade (Claude Haiku) and any future server-side logic needs a home. Supabase Edge Functions (Deno) keep everything in one vendor; Vercel serverless functions (Node) stay in the frontend repo. Choose one convention now so Phase 2 isn't split across two function runtimes.

**4. Image URL strategy: signed URLs vs public bucket**
The ADR uses a private bucket with signed URLs for garment images. Signed URLs expire (default 1 hour in Supabase). For a wardrobe app where images are displayed continuously, this means either: (a) regenerate signed URLs on every TanStack Query fetch, (b) store long-lived signed URLs (up to 1 year), or (c) make the bucket public with obscure paths (acceptable since garment images aren't sensitive). Decision affects both the storage setup and the image fetching logic in TanStack Query hooks.

---

## Single Best Next Task

**Start with: UI Cleanup (Phase 1A)**

Before any backend code is written, run the 10-item cleanup list from `ui-direction-and-cleanup.md`. This takes half a day and pays forward. The reason to do it first:

1. The cleanup items are non-negotiable — they will be done eventually. Doing them now means the auth screen, loading skeletons, and error states are already in the design system when Milestone 1B wires them up.
2. The `.skeleton` and `.error-banner` CSS classes are required by Milestone 1B — blank screens on async data load is the highest UI trust risk.
3. Every new component written after this point inherits the corrected token system. Every component written before it needs retrofitting.

**Assign to:** app-engineering-pod for items 1–7, 9–10 (CSS + minimal JSX). Item 8 is a one-line delete — include in the same PR.
**Model tier:** cheap (claude-haiku-4-5) — this is formatting and copy work, not architecture.
**Estimated time:** 2–4 hours.

After the cleanup PR is merged, move immediately to Milestone 1B: Supabase schema and auth gate.

---

*CEO Orchestrator | Phase 1 complete — awaiting Marko approval to proceed to Phase 2*
