# Architecture Decisions

## Decided by Perseus — 2026-04-05

### 1. Supabase setup
**Decision:** One Supabase project, separate dev/prod environments via branches or env vars.
**Why:** Simpler to manage, single billing, shared schema migrations.

### 2. Wear tracking
**Decision:** Store `timesWorn` and `lastWorn` directly on the garment row (denormalised).
**Why:** Fast reads, simple queries. Acceptable trade-off for this scale.

### 3. Server-side functions
**Decision:** Vercel serverless (Node.js) for all server functions — OCR upgrades, AI routes, image processing.
**Why:** Project is already on Vercel. Node ecosystem has better npm package support for AI SDKs and image processing libraries. Consistent stack, no Deno learning curve. Easy to migrate later if needed.

### 4. Image storage
**Decision:** Private Supabase Storage bucket + signed URLs (1-year expiry, refreshed client-side).
**Why:** User wardrobe photos are personal — private bucket is the right default for security and App Store compliance. Signed URLs with long expiry keep UX smooth. Standard pattern for user-uploaded content at scale.
