# Southwest Iowa Community Platform

> Production-ready full-stack edge community directory web platform and PWA tailored for **Southwest Iowa** (Creston, Corning, Afton, Greenfield, Osceola, Red Oak, Shenandoah, Clarinda, Atlantic, Mount Ayr, Winterset, and surrounding communities).

Connecting neighbors, rural renters, local service contractors, and community events on Cloudflare's Edge Runtime.

---

## 🌟 Key Features

- **Edge Architecture:** Cloudflare Pages + Functions / Workers with Hono API.
- **Database & Query Layer:** Cloudflare D1 (SQLite) with Drizzle ORM and automatic schema migrations.
- **Object Storage:** Cloudflare R2 bucket (`southwest-iowa-assets`) with client-side WebP compression (< 1200px) before upload.
- **Authentication:** Better Auth (supporting passwordless email magic links and Google OAuth) with SQLite/D1 session persistence.
- **Progressive Web App (PWA):** `manifest.webmanifest` + Service Worker (`sw.js`) for offline caching and "Add to Home Screen" mobile experience.
- **Mobile-First UX:**
  - Sticky local town dropdown (Creston, Corning, Afton, Greenfield, Osceola, Red Oak, etc.).
  - Bottom navigation dock (`Discover`, `Rentals`, `Services`, `Events`, `Post (+)`) with >=44px touch targets.
  - 24/7 Emergency Service quick-pills (Snow Removal, Plumbing, Furnace Repair, Hauling).
  - Anti-Scam safety alert banner on rental listings.
  - Direct 1-tap `Call Now` (`tel:`) and `Text SMS` (`sms:`) buttons.
  - `.ics` standard iCalendar export for community events.
  - Owner & Contractor Dashboard to toggle units between "Rented" and "Available" without deleting posts.

---

## 🛠️ Stack & Directory Structure

```
├── drizzle/
│   └── migrations/              # D1 SQL migrations generated via drizzle-kit
├── functions/
│   └── api/
│       └── [[route]].ts         # Cloudflare Pages Functions edge routing adapter
├── public/
│   ├── icon.svg                 # PWA vector app icon
│   ├── manifest.webmanifest     # Standalone PWA web manifest
│   └── sw.js                    # Service worker for offline static asset caching
├── src/
│   ├── db/
│   │   ├── constants.ts         # SW Iowa towns & default directory categories
│   │   └── schema.ts            # Drizzle ORM schema (Better Auth + Listings + R2 Media)
│   ├── server/
│   │   ├── auth.ts              # Better Auth edge adapter for D1
│   │   ├── types.ts             # Cloudflare D1 & R2 environment bindings
│   │   ├── index.ts             # Main Hono edge app
│   │   └── routes/
│   │       ├── categories.ts    # Category list & auto-seed
│   │       ├── cron.ts          # 30-day listing expiration job
│   │       ├── events.ts        # .ics calendar generator
│   │       ├── listings.ts      # CRUD, filtering, pagination, Zod validation
│   │       └── media.ts         # Direct R2 upload & image serving
│   └── client/
│       ├── components/          # Navbar, BottomNav, ScamBanner, ImageUploader, ListingCard
│       ├── views/               # HomeFeed, ListingDetail, CreateListingWizard, Dashboard
│       ├── utils/               # HTML5 Canvas WebP downscale compressor (<1200px)
│       ├── App.tsx              # Application layout & state controller
│       └── main.tsx             # React entry point
├── drizzle.config.ts            # Drizzle Kit configuration for Cloudflare D1
├── tailwind.config.js           # Custom prairie palette & accessible touch target settings
├── wrangler.jsonc               # Cloudflare bindings (D1: DB, R2: BUCKET, nodejs_compat)
└── vite.config.ts               # Vite build configuration
```

---

## 🚀 Local Development

### 1. Install dependencies
```bash
npm install
```

### 2. Start Vite frontend dev server
```bash
npm run dev
```

### 3. Generate D1 schema migrations
```bash
npm run db:generate
```

### 4. Run local Cloudflare Pages environment (with live D1 & R2 emulation)
```bash
npm run build
npm run pages:dev
```

---

## ☁️ Cloudflare Pages & Git Deployment

### Step 1: Create Cloudflare D1 Database & R2 Bucket
Run the following Wrangler commands in your terminal:

```bash
# 1. Create D1 Database
npx wrangler d1 create southwest-iowa-db

# 2. Create R2 Storage Bucket
npx wrangler r2 bucket create southwest-iowa-assets
```

Copy the generated `database_id` into `wrangler.jsonc`.

### Step 2: Apply D1 Database Migrations
```bash
# Apply migration to remote production D1
npm run db:migrate:remote
```

### Step 3: Push to GitHub & Connect to Cloudflare Pages
1. Push your repository to GitHub:
   ```bash
   git remote add origin https://github.com/<your-username>/southwest-iowa-community.git
   git branch -M main
   git push -u origin main
   ```
2. In the **Cloudflare Dashboard**:
   - Go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
   - Select your repository.
   - Set build preset to **Vite**:
     - **Build command:** `npm run build`
     - **Build output directory:** `dist`
   - In **Settings** > **Bindings**:
     - Add **D1 database binding**: Variable name `DB`, select `southwest-iowa-db`.
     - Add **R2 bucket binding**: Variable name `BUCKET`, select `southwest-iowa-assets`.
     - Add **Environment Variables**:
       - `BETTER_AUTH_SECRET`: Generate a secure 32+ character key.
       - `BETTER_AUTH_URL`: `https://your-domain.pages.dev`
3. Click **Save and Deploy**. Cloudflare Pages will automatically build and deploy your edge platform on every push!
