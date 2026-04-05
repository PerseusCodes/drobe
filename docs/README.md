# My Closet — Digital Wardrobe App

A mobile-first PWA that digitizes your wardrobe, suggests outfits, and helps you declutter smarter.

**Live:** [drobe-app-seven.vercel.app](https://drobe-app-seven.vercel.app)
**Repo:** [github.com/PerseusCodes/drobe](https://github.com/PerseusCodes/drobe)

---

## Features

### Today Dashboard
- Time-based greeting with current season
- Daily outfit suggestion (changes each day, based on your items + season)
- Quick stats: total items, saved outfits, total wears
- Quick action buttons: Add Item, Get Outfits, My Closet
- Recently added items carousel
- Seasonal styling tip

### Scan & Add Items
- **Camera or gallery upload** — separate buttons for iOS Safari compatibility
- **Auto color detection** — HSL-based analysis samples the center of the photo, ignores background surfaces, and identifies general color categories (Green, Blue, Red, etc.)
- **Auto-suggested name** — pre-fills from detected color + category (e.g. "Green Top")
- **Care label OCR** — snap a photo of the garment's care/composition label and Tesseract.js reads the text to auto-detect fabric types (cotton, polyester, silk, wool, etc.)
- **Fabric & care instructions** — select fabric types manually or via OCR; the app provides tailored wash, dry, iron, and care tips per fabric
- Category, season, occasion, and brand tagging

### My Closet
- Visual grid of all clothing items with photos
- Search bar and category filter chips (Tops, Bottoms, Outerwear, Dresses, Shoes, Accessories, Activewear)
- Stats row: total items, favorites, total wears
- Tap any item for a detail sheet: full info, care instructions, log wear, delete
- Favorite items with heart button

### Outfit Suggestions
- Rule-based outfit generation engine combining tops + bottoms + shoes (+ outerwear for cold seasons)
- Filter by occasion (casual, work, formal, athletic, night out, date) and season
- Color compatibility checking
- Save favorite outfits
- Regenerate for new combos

### Declutter
- Identifies items that don't fit into any generated outfit
- Flags items never worn
- Wardrobe gap analysis: suggests what categories/occasions are missing
- One-tap remove for items you want to donate

### Profile
- Wardrobe stats: total items, saved outfits, wears logged, top category, favorites
- Declutter shortcut
- Export/import JSON backup
- Clear all data

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| PWA | vite-plugin-pwa (generateSW) |
| Icons | Lucide React |
| Routing | State-based (single page, no router needed) |
| OCR | Tesseract.js (client-side) |
| Storage | localStorage (compressed JPEG images, ~20-50KB each) |
| Hosting | Vercel |
| Repo | GitHub |

---

## Project Structure

```
1Wardrobe/
├── public/
│   ├── favicon.svg
│   ├── icon-192.png
│   ├── icon-512.png
│   └── apple-touch-icon.png
├── src/
│   ├── main.tsx                  ← Entry point + BrowserRouter
│   ├── App.tsx                   ← Page state + wardrobe hook
│   ├── index.css                 ← Global styles + design system
│   ├── types.ts                  ← ClothingItem, Outfit, Fabric, etc.
│   ├── components/
│   │   ├── BottomNav.tsx         ← 5-tab navigation (Today, Closet, Scan, Outfits, Profile)
│   │   ├── ItemCard.tsx          ← Clothing item grid card
│   │   └── ItemDetail.tsx        ← Bottom sheet with full item info + care instructions
│   ├── hooks/
│   │   └── useWardrobe.ts        ← State + localStorage persistence for items & outfits
│   ├── pages/
│   │   ├── TodayPage.tsx         ← Dashboard landing page
│   │   ├── ClosetPage.tsx        ← Wardrobe grid with search/filters
│   │   ├── ScanPage.tsx          ← Add item: photo, OCR, color detect, tagging
│   │   ├── OutfitsPage.tsx       ← Generate + save outfit combos
│   │   ├── DeclutterPage.tsx     ← Unused items + wardrobe gaps
│   │   └── ProfilePage.tsx       ← Stats, backup, declutter shortcut
│   └── utils/
│       ├── colorDetect.ts        ← HSL-based color extraction from photos
│       ├── imageResize.ts        ← Compress photos to fit localStorage
│       ├── outfitEngine.ts       ← Rule-based outfit generation + declutter logic
│       ├── careInstructions.ts   ← Fabric → care instructions mapping
│       └── labelOcr.ts           ← Tesseract.js OCR for care label scanning
├── scripts/
│   └── generate-icons.mjs        ← Node canvas script to generate PWA icons
├── docs/
│   └── README.md                 ← This file
├── .npmrc                        ← legacy-peer-deps for Vite 8 compat
├── vercel.json                   ← (auto-detected Vite settings)
└── package.json
```

---

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#FAFAF8` | Page background |
| `--bg-card` | `#FFFFFF` | Card surfaces |
| `--bg-elevated` | `#F5F3EF` | Inputs, elevated areas |
| `--accent` | `#C67E5A` | Terracotta — buttons, active states, icons |
| `--text-bright` | `#2C2824` | Headings |
| `--text` | `#5C5750` | Body text |
| `--text-muted` | `#9C968E` | Secondary text, labels |
| `--border` | `#E8E4DD` | Card borders, dividers |
| Display font | Space Grotesk | Headings, stats |
| Body font | Inter | Body text, labels, buttons |

---

## How the Color Detection Works

1. Image is resized to 120x120 for analysis
2. Only the center 40% is sampled (30% margin on each side) to avoid background
3. Each pixel is converted from RGB to HSL
4. Pixels with extreme lightness (<4% or >97%) are skipped (shadows/highlights)
5. Center pixels are weighted 2x more than edge pixels
6. Each pixel is classified by hue into a general color category (Red, Blue, Green, etc.) or by saturation/lightness into achromatic (Black, Grey, White)
7. If any chromatic colors are found, achromatic colors are deprioritized (40% weight) since they're likely the background surface
8. Results are normalized and filtered to colors making up at least 5%

---

## Care Label OCR

Uses Tesseract.js running entirely in the browser (no server needed):

1. User snaps a photo of the care/composition label
2. Image is resized to 600px for better text readability
3. Tesseract extracts text from the image
4. Extracted text is matched against a dictionary of fabric names including:
   - Standard English names (cotton, polyester, silk, wool, etc.)
   - Alternate names (elastane→spandex, viscose→rayon, polyamide→nylon)
   - French (coton, soie, laine), Spanish (algodón), German (baumwolle, wolle)
5. Matching fabric chips are auto-selected
6. User can manually adjust if needed

---

## Local Development

```bash
npm install --legacy-peer-deps
npm run dev
```

Open http://localhost:5173

### Build

```bash
npm run build
npm run preview
```

### Generate Icons

```bash
npm install canvas --save-dev --legacy-peer-deps
node scripts/generate-icons.mjs
```

---

## Deployment

Hosted on Vercel. Push to `master` and deploy manually:

```bash
npx vercel --prod
```

Or set up Vercel Git integration for auto-deploys on push.

---

## Future Roadmap

- **Backend + auth** — Supabase for user accounts and cloud storage (remove localStorage limit)
- **AI outfit engine** — LLM-powered suggestions instead of rule-based
- **Weather integration** — daily outfit based on actual forecast
- **Calendar sync** — outfit suggestions based on upcoming events
- **Barcode scanning** — pull product info from barcodes
- **Social/sharing** — outfit of the day posts
- **Packing assistant** — select trip duration + destination, get a capsule wardrobe
- **Affiliate shopping** — wardrobe gap suggestions link to retailers
- **Donation integration** — connect with ThredUp, Poshmark, Goodwill
