# Drobe — UI Direction and Cleanup

**Date:** 2026-04-05  
**Author:** UI Designer agent  
**Status:** Ready for Marko review  
**Phase:** 1 — Architecture & Planning

---

## 1. What to Keep

These patterns are working well and should be carried forward unchanged into the rebuild.

### Token system (`index.css`)
The CSS custom properties are high quality. The warm linen palette (`--bg: #fcf9f4`), shadow scale, radius scale, safe-area insets, and nav/header height vars are all correct. This is the foundation — do not rebuild it.

### Garment card format
The `item-card` with `3:4` portrait aspect ratio is exactly right for clothing. The staggered grid (`.item-grid > *:nth-child(even) { margin-top: 32px }`) adds editorial feel reminiscent of fashion editorial layouts. Keep both.

### Bottom sheet pattern
`sheet-overlay` + `sheet` + `sheet-handle` + `slideUp` animation is the correct mobile pattern for item detail and form flows. Keep it.

### Chip filter rows
Horizontally scrollable `.chip-row` with negative margin bleed (`margin-left: -24px`) is a clean, space-efficient pattern. Keep.

### Blur header and nav
`backdrop-filter: blur(24px)` on both the top header and bottom nav gives the app iOS-native polish. Keep.

### Typography base
Manrope at weight 300 for h1, 500 for card labels, 700 for small-caps section labels — the hierarchy is correct. `letter-spacing: 0.15em` on section labels reads premium.

### Form field styling
`.field` with shadow-only borders (no explicit border rule) is clean and consistent. The custom select chevron is a good touch. Keep.

### `section-label` class
The `0.6rem / weight 700 / uppercase / 0.15em tracking` pattern is a strong visual anchor. Consistent use of it is one of the few things already applied uniformly. Keep and enforce.

### `gap-card` pattern (info rows)
Clean icon + text layout used in care info and wardrobe gaps. Reusable. Keep.

### `empty-state` class
Centered icon + heading + body copy structure is correct. Keep.

### Page `fadeIn` transition
Subtle `translateY(6px)` entry is appropriate. Keep.

### ScanPage step indicator
Two thin accent bars at top as progress indicator is minimal and correct. Keep.

### Outfit card two-column layout
1 large + 2 stacked small images in OutfitsPage is a good visual format for showing outfit combination. Keep.

---

## 2. What to Simplify or Remove

### Remove: gradient from `btn-primary`
The current `linear-gradient(135deg, var(--accent), var(--accent-light))` on primary buttons looks like a 2019 app, not a 2026 premium product. Zara-style brands use flat, solid, matte color. Replace with flat `background: var(--accent)`. Same change to the nav active state and save buttons in OutfitsPage.

**Before:** `linear-gradient(135deg, #884d27, #C07A50)`  
**After:** `background: var(--accent)` (#884d27, solid)

### Remove: nav active float (`translateY(-8px) scale(1.1)`)
The bouncing gradient pill floating upward is the most un-Zara element in the app. It reads as a game UI. Zara uses near-invisible active indicators — a small dot, a change in icon weight, or a subtle color shift.

**Replace with:** filled icon (already done via `fontVariationSettings`) + a small 3px dot indicator below the icon, no transform, no gradient, no shadow. Background can be a very subtle `var(--accent-dim)` tint if any.

### Remove: salmon stat card (`--secondary-bg: #fed3c7`)
The wide `.stat-card.wide` uses this salmon/pink background for the Wardrobe Score. It clashes with the warm linen palette — pink reads as error/notification, not editorial. Replace with `var(--bg-card)` (white) or `var(--bg-elevated)` (warm grey).

### Remove: Profile gamification chrome (pre-auth)
The "Wardrobe Level: Starter / Curator / Archivist / Elite" badge and the gradient edit-bubble overlaid on the avatar avatar do not belong in an MVP that has no auth yet. They create false expectations about features that don't exist. Remove the membership banner and the edit badge entirely. Restore them once auth and user profiles are real.

### Remove: Profile avatar (pre-auth)
The gradient avatar circle with the clothing rack icon is decorative placeholder UI that will be replaced by a real user photo or initial circle once auth ships. For now, lead Profile directly with stats — it's cleaner.

### Simplify: inline styles
Pages are built almost entirely with `style={{ ... }}` inline objects rather than CSS classes. This is the root cause of typographic drift — TodayPage h1 is `2.2rem weight 300`, DeclutterPage h1 is `1.8rem weight 300`, ClosetPage h1 is `2.2rem weight 200 italic`. These are all "page titles" but look different.

The fix is not a full refactor before Milestone 1 — it's enforcing the **two CSS classes defined below** for page titles and adding them to pages rather than overriding inline.

### Simplify: `--display` and `--sans` font alias
Both `--sans` and `--display` map to `'Manrope'`. This alias has zero effect but implies a planned second font. Either use it (add a serif display face) or collapse to `--sans` only. Recommendation: add **Cormorant Garamond** (weight 300) as `--display` for h1 page titles only — it adds editorial elegance at near-zero cost. If that's out of scope for Milestone 1, remove the `--display` alias and use `--sans` throughout for now.

### Remove: "Swipe right if it sparks joy, left to let it go" copy
Cliché Marie Kondo reference in DeclutterPage. Replace with neutral instruction copy or remove entirely — the Keep/Remove buttons are self-explanatory.

### Simplify: profile "DROBE v1.0 — All data stored locally" footer
This copy will actively mislead users once Supabase auth ships. Plan to remove it in Milestone 1 and replace with an auth status row (e.g. "Signed in as user@email.com").

---

## 3. Visual System Guidance

### Spacing scale
```
4px   — intra-element (icon gap, color-dot gap)
8px   — tight sibling spacing (chip gap, chip-row gap)
12px  — card internal elements
16px  — grid gap, section sub-elements
24px  — page horizontal padding (canonical — do not override inline)
32px  — section-to-section gap
40px  — top-of-page breathing room before first section
48px  — large empty state padding
```

Do not introduce arbitrary values like `20px`, `28px`, `36px` outside of component-specific card padding. Stick to these anchors.

### Typography
```
Page title (h1)      2rem / weight 300 / tracking -0.01em / color: --text-bright
Section label        0.6rem / weight 700 / uppercase / tracking 0.15em / color: --text-secondary
Card name            0.7rem / weight 500 / uppercase / tracking 0.08em / color: --text
Body                 0.88–0.92rem / weight 400 / color: --text
Body muted           0.88rem / weight 400 / color: --text-muted
Stat value           1.8rem / weight 300 (large) or 1.1rem / weight 700 (small)
Label micro          0.6rem / weight 700 / uppercase / tracking 0.12em
```

**Formal rule:** all page title h1s must use the same visual weight. Italic and weight 200 on ClosetPage is a divergence — remove it. One canonical page title style.

### Color usage
```
Background              #fcf9f4 (--bg) — page canvas
Card surface            #ffffff (--bg-card)
Elevated surface        #ebe8e3 (--bg-elevated) — chips, inactive states
Low surface             #f0ede9 (--bg-surface-low) — image placeholders, stat cards
Accent                  #884d27 (--accent) — primary buttons, active states, icons
Accent dim              rgba(136,77,39, 0.08) — focus rings, subtle tints
Text primary            #1c1c19 (--text-bright)
Text default            #53443c (--text)
Text muted              #85736a (--text-muted)
Text secondary          #795950 (--text-secondary) — labels, nav inactive
Border                  #e5e2dd (--border)
Danger                  #ba1a1a (--danger) — delete actions only
Success                 #268087 (--success) — OCR confirmation, wear logged
```

**Remove from active use:** `--secondary-bg: #fed3c7` (salmon). Do not introduce new colors without a clear semantic role.

**Wordmark color change:** the "DROBE" header currently uses `var(--text-secondary)` (#795950, a warm brownish-red). Change to `var(--text-bright)` (#1c1c19) for a cleaner, more neutral wordmark. Zara wordmarks are always black.

### Surfaces and elevation
Three surface levels, used consistently:
- **Level 0** `--bg` — page background  
- **Level 1** `--bg-card` — cards, sheets, search inputs  
- **Level 2** `--bg-elevated` / `--bg-surface-low` — chips, stat inner blocks, image placeholders  

Cards sit on Level 1 with `var(--shadow)`. Never add elevation to something already on Level 1 (no shadow-on-shadow).

### Card treatment
- **Item card:** no shadow on the image wrap (`var(--shadow-sm)` only), no border. The `3:4` ratio is canonical.
- **Outfit card:** `border-radius: var(--radius-2xl)` (32px), `padding: 20px`, `var(--shadow)`. Correct as-is.
- **Declutter card:** `border-radius: var(--radius-xl)` (24px), full-bleed image, `var(--shadow-md)`. Keep.
- **No mixing:** do not apply `--shadow-md` to item cards — they should feel light.

### Button hierarchy
```
Primary    flat var(--accent) — no gradient, no shadow, border-radius: --radius-sm (12px)
Secondary  var(--bg-elevated) fill, --text-bright text — muted, for non-destructive alternates
Ghost      transparent, var(--accent) text — for text-like actions (Change photo, View label)
Danger     var(--danger-bg) fill, var(--danger) text — delete only
```

Button height: 52–56px for full-width CTAs, 44–48px for inline actions. Text: 0.82–0.88rem, weight 700, uppercase, tracking 0.06em.

### Bottom nav active state
```
Active:    filled icon (FILL=1) + 3px accent dot below icon
           color: var(--accent)
           background: none (or var(--accent-dim) if needed)
           no transform, no gradient, no box-shadow

Inactive:  outline icon (FILL=0)
           color: var(--text-secondary) at 50% opacity
```

### Icons
Material Symbols Outlined at weight 300. Fill variant (`FILL 1`) only for: active nav icons, heart/favorite, bookmark saved state, check_circle confirmation. Never fill decorative icons.

---

## 4. Minimum Cleanup Before Milestone 1 Implementation

These are the specific changes that must happen before new feature code is written, to prevent inconsistency from compounding:

| # | Change | File(s) | Impact |
|---|---|---|---|
| 1 | Replace gradient on `btn-primary` → flat solid `var(--accent)` | `index.css` | Removes the biggest premium-breaker |
| 2 | Fix nav active state: remove `translateY(-8px)` and `scale(1.1)`, replace gradient bg with `var(--accent-dim)` + small dot indicator | `index.css`, `BottomNav.tsx` | Second biggest brand mismatch |
| 3 | Add `.page-title` CSS class (2rem / weight 300 / tracking -0.01em) and apply it in all pages instead of inline h1 overrides | `index.css`, all page files | Stops typography drift |
| 4 | Change `stat-card.wide` background from `var(--secondary-bg)` to `var(--bg-card)` | `index.css` | Removes jarring pink |
| 5 | Fix wordmark color: `--text-secondary` → `var(--text-bright)` on `.top-header-title` | `index.css` | Neutral, clean wordmark |
| 6 | Remove Profile gamification section (Membership Banner + wardrobe level + avatar edit badge) | `ProfilePage.tsx` | Aligns with real MVP scope |
| 7 | Fix `declutter-stat .stat-txt` color: change from `var(--border-light)` to `var(--text-muted)` | `index.css` | Accessibility — currently near-invisible |
| 8 | Remove "Swipe right if it sparks joy" copy | `DeclutterPage.tsx` | Brand voice |
| 9 | Remove "DROBE v1.0 — All data stored locally" footer copy from Profile | `ProfilePage.tsx` | Will mislead once auth ships |
| 10 | Add loading skeleton placeholders (CSS-only, two variants: card skeleton, list-row skeleton) | `index.css` | Required for Milestone 1 async data — blank screens will feel broken |

Items 1–7 are CSS/minimal JSX changes. Items 8–9 are single-line copy deletions. Item 10 is additive CSS.

**Do not attempt a full inline-style refactor before Milestone 1.** The pages work and the inline style debt is manageable. A complete refactor now risks introducing regressions while the data layer is also being swapped. Migrate pages to CSS classes page by page during Milestone 2 polish.

---

## 5. UI Risks That Would Harm Trust

These are issues that, if unaddressed, will damage user confidence in the product.

### HIGH: No loading states
Milestone 1 replaces localStorage with Supabase. Every page will now show blank white before data arrives. Without skeletons or at minimum a spinner, users will think the app is broken. This is the highest-priority UI risk for Milestone 1.

**Mitigation:** Add `.skeleton` CSS class (animated gradient shimmer) in the cleanup. Use it for:
- Item card grid (show 6 skeleton cards)
- Outfit card list (show 2 skeleton outfits)
- Today stats (show 3 skeleton stat cards)

### HIGH: No error states
If Supabase auth fails, image upload fails, or the network is down — there is currently nowhere in the UI to show it. Users will see nothing, which reads as a bug.

**Mitigation:** Add a reusable `.error-banner` CSS class (warm red tint, danger color). Each page needs one error slot at the top. Implement during Milestone 1 data wiring, not after.

### MEDIUM: Image quality expectation gap
Without background removal, garment photos will show beds, floors, and hangers behind clothing. On the clean card grid, these will look cluttered. Users may mistake image quality for product quality.

**Mitigation:** Two options — choose one:
- Apply a subtle `rgba(0,0,0,0.04)` overlay + `mix-blend-mode: multiply` to garment images so busy backgrounds recede slightly.
- Add a consistent 8px padding and `var(--bg-surface-low)` background inside the card image container so photos sit in a "frame" — makes varied backgrounds look intentional.

Do not promise background removal in the UI until it ships.

### MEDIUM: Auth UI will need to be built from scratch
The MVP requires a full auth screen (sign in, sign up, magic link, Google OAuth) using Supabase Auth. There are no pre-built components. This screen is the first thing new users see. If it looks different from the rest of the app (which it will if built quickly without the existing token system), trust drops immediately.

**Mitigation:** The auth screen must use the same `--bg`, `--bg-card`, `.field`, `.btn-primary`, and `.top-header` patterns as the rest of the app. It should feel like a natural part of Drobe, not a Supabase splash page. Allocate design time for this — it is not a "wire it up and style later" screen.

### LOW: PWA "Add to Home Screen" UX on iOS
iOS Safari does not show a native install prompt. Users must know to tap the Share sheet. An app that looks polished in-browser but requires a non-obvious gesture to install feels incomplete.

**Mitigation:** Add an install prompt banner (iOS-specific — detect with `window.navigator.standalone` and user agent check). Simple card with Share icon illustration and one-sentence instruction. Dismissible. Show once per session.

### LOW: Declutter page lacks swipe gesture
The page says "swipe right/left" but implements only tap buttons. There is no swipe handler. This is a functional gap that becomes a trust issue when a user tries to swipe and nothing happens.

**Mitigation:** Either add swipe gesture detection (touch events or a library like `@use-gesture/react`) or remove the swipe instruction copy. Removing the copy is the zero-risk path for Milestone 1.

---

## Summary Table

| Category | Keep | Change | Remove |
|---|---|---|---|
| Color system | Warm linen palette, accent terracotta, token system | Salmon stat card → neutral, wordmark → text-bright | — |
| Typography | Manrope, weight hierarchy, section-label | Consolidate h1 into one canonical class | Italic/weight 200 on Closet h1 |
| Buttons | Hierarchy (primary/secondary/ghost/danger), sizing | Primary → flat solid, no gradient | Gradient, box-shadow on primary |
| Navigation | Icon-only bottom nav, structure | Active state → no float, no gradient, dot indicator | `translateY(-8px)`, `scale(1.1)` |
| Cards | Item 3:4 grid, outfit two-column, sheet modal | — | — |
| Profile | Stats, settings rows, export/import | Remove gamification until auth is real | Membership banner, avatar, "locally stored" copy |
| Interactions | Chip filters, multi-select, step indicator | — | Swipe instruction (until gesture is built) |
| Missing | — | Add loading skeletons, error banner, auth screen | — |

---

*Prepared by: UI Designer agent | For Marko review*
