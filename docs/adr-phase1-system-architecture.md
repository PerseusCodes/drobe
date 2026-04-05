# ADR Phase 1 — System Architecture for Drobe

**Date:** 2026-04-05  
**Status:** Proposed — awaiting Marko review  
**Phase:** 1 — Architecture & Planning

---

## Context

The current prototype is a Vite + React 19 SPA with 100% localStorage persistence. It works on a single device and loses all data on browser reset. Images are stored as data-URIs inside localStorage, which will hit quota limits immediately at real use. Care label OCR runs client-side with Tesseract.js. There is no auth, no backend, and no sync.

The rebuild goal is a **phone-testable web app** (PWA on a real URL) as the first deliverable, with a path to iOS/Android App Store wrappers. All decisions are optimized for **low operational cost at MVP scale** and **avoiding premature complexity**.

---

## ADR-001: Backend and Service Architecture

### Decision

Use **Supabase** as the sole backend service for MVP (Postgres database + Auth + Storage + Realtime).

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| **Supabase** | Postgres + Auth + Storage + Realtime in one, generous free tier, open-source, self-hostable, TypeScript client, RLS built-in | Vendor dependency (mitigated by self-hosting option) |
| **Firebase** | Mature, well-known, good offline support | NoSQL Firestore is awkward for relational garment/outfit data; Google lock-in; query limitations |
| **Custom Node.js API** | Full control | Significant ops overhead: auth, DB management, infra, sessions — no value for MVP |
| **PocketBase** | Simple self-hosted BaaS | Self-hosting required, less ecosystem, no managed option |

### Decision Outcome

Supabase wins on every MVP dimension:

- **Postgres** is the right model: garments relate to outfits (foreign keys), wear logs reference garments, season/occasion fields are typed arrays. Relational fits better than document-store.
- **Row Level Security (RLS)** enforces per-user data isolation at the database level — no application-level filtering bugs.
- **Supabase Storage** handles images natively, with signed URL generation and CDN delivery.
- **Supabase Realtime** gives multi-device sync for free once the table is enabled.
- **Free tier** covers ~500 MB database, 1 GB Storage, 50,000 MAU — more than sufficient for beta.

### Consequences

- All backend config lives in Supabase project settings and SQL migration files.
- No custom API server to maintain for MVP. API calls go directly from client → Supabase JS SDK.
- Image processing (background removal) is the one workload Supabase cannot handle — this is addressed in ADR-004.
- When/if self-hosting is needed: Supabase is open-source (Docker Compose), migration path exists.

---

## ADR-002: Authentication

### Decision

Use **Supabase Auth** with email/password, magic link, Google OAuth, and Apple Sign-In.

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| **Supabase Auth** | Free, built into the stack, integrates with RLS, supports all needed providers | UI is basic (customizable with headless components) |
| **Clerk** | Excellent DX, pre-built components, very polished | $25+/month after free tier; separate vendor |
| **Auth0** | Enterprise-grade | Expensive at scale, overkill for MVP |
| **Roll your own** | Control | Never do this |

### Decision Outcome

Supabase Auth is the correct choice at this stage:

- **Already part of the stack** — no additional vendor, no separate billing.
- **Apple Sign-In** is required by App Store rules for any app offering social login. Supabase Auth supports it.
- **Google OAuth** covers the majority of Android and web users.
- **Magic link** is a good fallback and removes password friction.
- JWTs from Supabase Auth automatically satisfy RLS policies — `auth.uid()` in Postgres policies maps to the logged-in user with zero extra code.

### Consequences

- Auth UI must be custom-built (no pre-built Clerk components). Use `@supabase/auth-ui-react` for a fast start, replace with custom UI later.
- OAuth redirect URIs need configuration per environment (local, preview, production).
- Apple Sign-In requires Apple Developer account ($99/year) — needed for App Store regardless.

---

## ADR-003: Data and Storage Model

### Decision

Relational schema in Supabase Postgres. Images in Supabase Storage private bucket. Wear history as a separate `wear_events` table.

### Schema

```sql
-- Garments: core inventory
CREATE TABLE garments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text NOT NULL,
  category     text NOT NULL,         -- 'tops' | 'bottoms' | 'outerwear' | ...
  color_hex    text,
  color_name   text,
  season       text[] DEFAULT '{}',   -- ['spring','summer'] etc
  occasions    text[] DEFAULT '{}',
  fabrics      text[] DEFAULT '{}',
  brand        text,
  image_path   text,                  -- Supabase Storage path
  label_image_path text,
  care_instructions jsonb,            -- OCR-extracted structured data
  favorite     boolean DEFAULT false,
  date_added   timestamptz DEFAULT now(),
  metadata     jsonb DEFAULT '{}'     -- escape hatch for future fields
);

-- Outfits: named combinations
CREATE TABLE outfits (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text NOT NULL,
  occasion     text,
  season       text,
  saved        boolean DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

-- Outfit → Garment join with ordering
CREATE TABLE outfit_items (
  outfit_id    uuid REFERENCES outfits(id) ON DELETE CASCADE,
  garment_id   uuid REFERENCES garments(id) ON DELETE CASCADE,
  position     int DEFAULT 0,
  PRIMARY KEY (outfit_id, garment_id)
);

-- Wear events: immutable log, source of truth for "times worn" and "last worn"
CREATE TABLE wear_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  garment_id   uuid REFERENCES garments(id) ON DELETE SET NULL,
  outfit_id    uuid REFERENCES outfits(id) ON DELETE SET NULL,
  worn_at      date NOT NULL DEFAULT CURRENT_DATE,
  notes        text
);
```

**RLS policies** on every table: `auth.uid() = user_id`.

### Image Storage Layout

```
Storage bucket: garments  (private)

{user_id}/{garment_id}/original.jpg     ← raw upload
{user_id}/{garment_id}/processed.jpg    ← background-removed (Phase 2)
{user_id}/{garment_id}/label.jpg        ← care label photo
{user_id}/{garment_id}/thumb.jpg        ← 400px thumbnail (Phase 2)
```

Client accesses images via short-lived signed URLs generated server-side or via Supabase Storage SDK.

### Why Separate wear_events Instead of timesWorn Counter

The prototype uses `timesWorn: int` and `lastWorn: date` on the garment. This is brittle:
- Cannot reconstruct wear history
- Cannot analyze frequency by time period (needed for declutter score)
- Cannot associate a specific outfit with a wear

`wear_events` is an append-only log. `timesWorn` and `lastWorn` become computed views or client-side aggregates. Small extra cost, large future value.

### Consequences

- Client must write a `wear_events` row on "Log Wear" rather than patching the garment row.
- `timesWorn` and `lastWorn` on `ClothingItem` (TypeScript) become derived from `wear_events` — no mismatch if computed consistently.
- Schema migrations managed via Supabase CLI migration files in `supabase/migrations/`.

---

## ADR-004: Image Pipeline — MVP vs Phase 2

### Decision

**MVP:** client-side resize and upload only. No background removal. Care label OCR stays client-side (Tesseract.js).  
**Phase 2:** server-side background removal via a lightweight Python microservice on Fly.io.

### Options Considered

**Background Removal:**

| Option | Cost | Complexity | Quality |
|---|---|---|---|
| remove.bg API | ~$0.10/image (pay-per-call) | Low (REST call) | Excellent |
| rembg (self-hosted Python) | ~$0/image once running | Medium (Fly.io container) | Good |
| client-side WASM (background.js) | $0 | High (large WASM bundle) | Acceptable |
| Skip for MVP | $0 | Zero | — |

**Care Label OCR:**

| Option | Notes |
|---|---|
| Tesseract.js (current) | Already works, handles blurry, free, client-side |
| Google Vision API | Better accuracy, $1.50/1000 calls |
| Claude claude-haiku-4-5 vision | Best accuracy for blurry labels, ~$0.001/image |

### Decision Outcome

**MVP image pipeline:**
1. User captures/selects image on device
2. Client resizes to max 1200px on longest side, JPEG quality 85 (using Canvas API — already available in prototype)
3. Upload compressed JPEG to Supabase Storage
4. Store `image_path` on garment row
5. Display via signed URL or public CDN URL

**Care label (MVP):**  
Keep Tesseract.js. It already works in the prototype. Upgrade to Claude Haiku vision in Phase 2 if accuracy is a pain point — trivial swap since it'll be behind a server-side API route.

**Background removal (Phase 2 only):**  
Build a single Fly.io Python function (`rembg` library, ~256 MB RAM) triggered async after upload. It reads `original.jpg`, writes `processed.jpg`, updates the garment row. Client polls or uses Supabase Realtime subscription to update the displayed image when processed.

**Why skip bg removal for MVP:**  
Background removal does not block core value (catalog, search, outfit building). It's polish. The cost of remove.bg at even 1000 users onboarding 30 items each = $3,000 in API calls. rembg self-hosted requires operational maturity. The right time to add it is when we have users.

### Consequences

- MVP garment photos will have real backgrounds. This is acceptable for phone-testable validation.
- The `image_path` / `processed_image_path` split in storage is already prepared so Phase 2 requires no schema change.
- Tesseract.js bundles ~10 MB WASM. This is already in the prototype and acceptable for a PWA.

---

## ADR-005: Sync and Offline Strategy

### Decision

**Online:** TanStack Query for server state, optimistic updates.  
**Offline writes:** Workbox BackgroundSync queue.  
**Offline reads:** TanStack Query persistence to IndexedDB (via `@tanstack/query-sync-storage-persister` or `idb`).  
**Multi-device sync:** Supabase Realtime subscriptions on `garments` and `outfits`.

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| **TanStack Query + Workbox** | Pragmatic, well-understood, good DX | Not truly local-first; offline writes replay on reconnect only |
| **ElectricSQL** | True local-first Postgres sync | Alpha quality, complex migrations, significant ops risk |
| **Supabase Realtime only** | Built-in, simple | No offline writes; loses changes if device goes offline mid-edit |
| **Keep localStorage** | Zero work | No cross-device sync, quota limits, no auth |

### Decision Outcome

The pragmatic stack:

```
Device ──online──▶  TanStack Query ──▶ Supabase (Postgres + Storage)
                         │
                    IndexedDB cache (stale-while-revalidate reads offline)
                         │
                    Workbox BackgroundSync (queues failed mutations)
                         │
                    Supabase Realtime subscription (new items from other devices)
```

**Reads offline:** IndexedDB-backed TanStack Query cache. User can browse their closet, see outfits, use Declutter page — all from cached data.

**Writes offline:** Workbox BackgroundSync enqueues `POST /api/garments`, `PATCH /api/garments/:id` etc as fetch requests. Replays when connectivity returns. Conflicts resolved with last-write-wins (sufficient for single-user MVP).

**Multi-device sync:** Supabase Realtime fires `INSERT`/`UPDATE`/`DELETE` events on the `garments` table. TanStack Query cache is invalidated on event receipt — new garment added on phone appears on desktop within ~1s.

### Why Not ElectricSQL

ElectricSQL is the right long-term direction for truly offline-first Postgres sync. But it is operationally complex, requires a separate Electric sync server, and the schema migration story is still evolving. The pragmatic stack above handles 95% of real-world offline scenarios (brief connectivity gaps) at near-zero extra cost. Migrate to ElectricSQL in Phase 3 if offline-first becomes a hard user requirement.

### Consequences

- Offline write queue relies on Workbox BackgroundSync, which requires a Service Worker. The prototype already has vite-plugin-pwa configured.
- Write conflicts are not handled beyond last-write-wins. Acceptable for single-user data at MVP scale.
- IndexedDB cache size must be managed — images are served via URL, not stored in cache (no quota issue).

---

## ADR-006: Deployment Path

### Decision

**Frontend:** Vercel (static Vite SPA deploy, CDN-delivered, preview URLs per PR).  
**Backend:** Supabase hosted (managed Postgres, Auth, Storage, Realtime).  
**Image processing (Phase 2):** Fly.io Python microservice.  
**Mobile (Phase 1):** PWA on Vercel URL, installable on iOS/Android via browser.  
**Mobile (Phase 2):** Capacitor wrapper for App Store / Play Store distribution.

### Stack Decision: Keep Vite, Not Next.js

The app is a **fully authenticated SPA**. There are no public pages that benefit from SSR. SEO is irrelevant (logged-in wardrobe). Converting to Next.js App Router adds:
- Build complexity
- Server/client component boundary decisions for every file
- A more expensive Vercel deployment tier at scale

Keep Vite + React SPA for MVP. If a public marketing page is needed, add it as a separate Next.js site or a simple static page.

### Deployment Pipeline

```
git push → Vercel CI builds Vite → Preview URL (every PR/branch)
                                 → Production URL (main branch merge)
```

**Environment management:**
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Vercel environment variables
- Supabase project per environment: `drobe-dev`, `drobe-prod`
- Schema migrations via `supabase db push` in CI before deploy

### Mobile PWA Path

Phase 1 deliverable: share a Vercel preview URL → open in Safari/Chrome on phone → "Add to Home Screen" → installed PWA with offline capability. This is sufficient for real-device testing and user interviews.

Phase 2: Capacitor wraps the existing Vite SPA (no code changes required to the React app). Outputs to iOS `.ipa` and Android `.apk`. Capacitor plugins add:
- Native camera access (better than `<input type="file">`)
- Native haptics
- Push notifications

### Cost Estimate at MVP Scale (0–500 users)

| Service | Free Tier | Paid if exceeded |
|---|---|---|
| Vercel | 100 GB bandwidth, unlimited deploys | ~$20/month Pro |
| Supabase | 500 MB DB, 1 GB Storage, 50k MAU | ~$25/month Pro |
| Fly.io (Phase 2) | 3 shared VMs free | ~$2–5/month for rembg |
| **Total MVP** | **$0** | **~$50/month at growth** |

### Consequences

- No custom server to maintain.
- Vercel preview URLs give stakeholder demos for free.
- Supabase free tier is enough for early beta; upgrade is one click.
- Fly.io image processor is independently deployable and scoped to background removal — failure there doesn't break the core app.
- Capacitor wrapping in Phase 2 is low-risk: the web app works fully in a WebView.

---

## Summary: Technology Stack

| Concern | Choice | Rationale |
|---|---|---|
| Frontend | Vite + React 19 + TypeScript | Keep prototype investment, no SSR needed |
| Styling | Keep existing CSS, add Tailwind in Phase 2 | Avoid rework now |
| State / server cache | TanStack Query v5 | Industry standard, offline persistence plugin |
| Database | Supabase Postgres | Relational, RLS, free tier, open-source |
| Auth | Supabase Auth | Free, Apple+Google support, JWT → RLS |
| File storage | Supabase Storage | Same SDK, signed URLs, CDN |
| Realtime | Supabase Realtime | Free with project, multi-device sync |
| Offline writes | Workbox BackgroundSync | Already using vite-plugin-pwa |
| Image pipeline MVP | Canvas resize + upload | Zero cost, zero ops |
| Image pipeline Phase 2 | rembg on Fly.io | ~$2–5/month, self-contained |
| Care label OCR | Tesseract.js (upgrade to Haiku vision Phase 2) | Already working |
| Deployment | Vercel (SPA static) | Free tier, preview URLs, zero config |
| Mobile Phase 1 | PWA (installable from Vercel URL) | No App Store needed for testing |
| Mobile Phase 2 | Capacitor wrapper | Reuses web codebase exactly |

---

## Decisions Deferred to Later Phases

- **Outfit recommendation AI** — not needed until sufficient garment data exists; will use Claude claude-haiku-4-5 vision + embeddings
- **Background removal** — Phase 2, once user validation is complete
- **React Native migration** — only if Capacitor WebView performance is unsatisfactory for real users
- **ElectricSQL local-first sync** — Phase 3 if offline-first becomes a hard requirement
- **Push notifications** — Phase 2 via Capacitor + FCM/APNS

---

*Prepared by: System Architect agent | Requires Marko approval before Phase 2 begins*
