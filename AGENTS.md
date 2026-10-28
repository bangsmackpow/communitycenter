# Developer & AI Agent Guidelines: Southwest Iowa Community Central

This document serves as the architectural reference, operational manual, and design specification for future AI agents and software engineers working on the **Southwest Iowa Community Central** web platform and PWA.

---

## 1. System Mission & Core Domain

Southwest Iowa Community Central is an edge-native community directory and housing platform designed specifically for rural Southwest Iowa (Union, Adams, Adair, Clarke, Montgomery, Page, Cass, and Ringgold counties).

### Primary Hubs & Towns Covered:
- **Major Hubs:** Creston, Corning, Red Oak, Osceola, Shenandoah, Clarinda, Atlantic, Greenfield, Winterset.
- **Rural Towns & Communities:** Afton, Mount Ayr, Lenox, Bedford, Villisca, Fontanelle, Orient, Prescott.

### Core Service Pillars:
1. **Rental Housing Exchange:** Long-term rentals, apartments, duplexes, single-family homes, and farmsteads. Anti-scam protection and federal Fair Housing Act compliance are mandatory.
2. **Local Trade & Emergency Contractors:** 24/7 snow removal, emergency furnace/plumbing repair, electrical, mowing, hauling, and handyman services.
3. **Community Events & Benefit Dinners:** Pancake breakfasts, county fairs, high school sports, farmers markets, and Opera House showcases with `.ics` calendar exports.

---

## 2. Technical Stack & Architecture

| Layer | Technology | Key Details |
| :--- | :--- | :--- |
| **Edge Hosting** | Cloudflare Pages + Functions | Deployed on Cloudflare's global edge network (V8 isolates). Zero cold starts. |
| **API Framework** | [Hono v4](https://hono.dev/) | Ultra-lightweight Web Standards API router with `@hono/zod-validator`. |
| **Database & ORM** | Cloudflare D1 (SQLite) + Drizzle ORM | Serverless relational SQLite at the edge with typed Drizzle schema (`src/db/schema.ts`). |
| **Object Storage** | Cloudflare R2 (`southwest-iowa-assets`) | S3-compatible zero-egress bucket. Direct multipart uploads + edge caching. |
| **Authentication** | Native Edge PBKDF2 + OAuth | Edge-compatible Web Crypto PBKDF2 SHA-256 (100,000 iterations), Google & Facebook OAuth. |
| **Billing & Payments** | Stripe API | $10/mo or $100/yr Pro tier via Stripe Checkout Sessions + Webhook signature verification + Customer Portal. |
| **Frontend UI** | Vite + React 18 + Tailwind CSS | Mobile-first directory interface with Lucide Icons, dark mode toggle, and PWA service worker. |

---

## 3. Directory Structure

```
├── drizzle/
│   └── migrations/              # Cloudflare D1 SQL migrations generated via drizzle-kit
├── functions/
│   └── api/
│       └── [[route]].ts         # Cloudflare Pages Functions adapter routing requests to Hono
├── public/
│   ├── icon.svg                 # PWA vector app icon
│   ├── manifest.webmanifest     # Standalone PWA web manifest
│   └── sw.js                    # Service worker for offline static asset caching
├── src/
│   ├── db/
│   │   ├── constants.ts         # SW Iowa town lists & 14 default categories
│   │   └── schema.ts            # Drizzle ORM SQLite schema definitions & TypeScript types
│   ├── server/
│   │   ├── crypto.ts            # Edge Web Crypto PBKDF2 password hashing & verification
│   │   ├── auth.ts              # Better Auth edge adapter for D1
│   │   ├── types.ts             # Cloudflare D1 (DB) & R2 (BUCKET) bindings & AppContext
│   │   ├── index.ts             # Main Hono app mounting all routes, health check, sitemap & robots
│   │   └── routes/
│   │       ├── admin.ts         # User management, password resets, Pro licenses & safety queue
│   │       ├── auth.ts          # Register, login, session validation, Google/Facebook OAuth
│   │       ├── billing.ts       # Stripe Checkout, Customer Portal & Webhook handlers
│   │       ├── categories.ts    # Category retrieval & seeding
│   │       ├── cron.ts          # 30-day listing expiration cleanup
│   │       ├── events.ts        # .ics iCalendar file generator for community events
│   │       ├── listings.ts      # Listing CRUD, pagination, reports & online inquiries
│   │       ├── media.ts         # Direct R2 file uploads & edge cached image serving
│   │       └── suggestions.ts   # Crowdsourced business recommendations & edits
│   └── client/
│       ├── components/          # Navbar, BottomNav, Footer, ScamBanner, AuthModal, PricingModal, etc.
│       ├── views/               # HomeFeed, ListingDetail, CreateListingWizard, Dashboard
│       ├── utils/               # HTML5 Canvas client-side WebP image downscaler (<1200px)
│       ├── App.tsx              # Application layout controller & routing state
│       ├── sampleData.ts        # Fallback starter data
│       └── main.tsx             # React entry point
├── drizzle.config.ts            # Drizzle Kit configuration for Cloudflare D1 SQLite
├── seed_remote.sql              # Remote D1 seed script for categories, users, listings & media
├── wrangler.jsonc               # Cloudflare bindings (D1: DB, R2: BUCKET, nodejs_compat)
└── vite.config.ts               # Vite configuration
```

---

## 4. Database Schema (D1 SQLite)

The platform schema is defined in [`src/db/schema.ts`](file:///C:/Users/curtis/Desktop/dev/communitycentral/src/db/schema.ts) across 10 tables:

1. `users`: Core profile (`id`, `name`, `email`, `emailVerified`, `image`, `role`, `tier`, `tierExpiresAt`). Roles: `user`, `landlord`, `business`, `admin`. Tiers: `free`, `pro_monthly`, `pro_annual`.
2. `sessions`: Authenticated sessions (`id`, `userId`, `token`, `expiresAt`, `ipAddress`, `userAgent`).
3. `accounts`: Credential password hashes (PBKDF2) or OAuth provider tokens.
4. `verifications`: Tokens for passwordless email verification and magic links.
5. `categories`: Directory taxonomies across `rental`, `service`, and `event` types.
6. `listings`: Comprehensive directory records:
   - Location: `town`, `address`, `serviceRadiusMiles`, `zip`.
   - Rental fields: `bedrooms`, `bathrooms`, `depositCents`, `petsAllowed`, `utilitiesIncluded`, `laundryType`, `parkingType`.
   - Service fields: `emergencyAvailable`, `insured`, `freeEstimates`, `serviceOfferings`.
   - Event fields: `eventDate`, `eventEndDate`, `locationVenue`, `ticketUrl`, `isFree`.
   - Lifecycle: `status` (`active`, `pending`, `rented`, `expired`, `hidden`), `isFeatured`, `expiresAt` (30 days default).
7. `listing_media`: Photos with `r2Key`, `url`, `isPrimary`, and `sortOrder`.
8. `reports_and_flags`: Community safety reports (`scam`, `outdated`, `duplicate`, `inappropriate`, `status: 'open' | 'resolved' | 'dismissed'`).
9. `inquiries`: Direct messaging leads sent to landlords/contractors (`senderName`, `senderEmail`, `senderPhone`, `message`, `status`).
10. `suggestions`: Crowdsourced business recommendations and listing edit suggestions.

---

## 5. Security & Authorization Rules

1. **Guest First:** When visitors arrive or open shared links, `currentUser` MUST start as `null`. Never mock-authenticate a user on page load.
2. **Listing Ownership:**
   - Free users and contractors can only edit, mark as rented, or delete listings where `listing.userId === currentUser.id`.
   - Admin accounts (`role === 'admin'`) have global permissions across all listings.
3. **Tier Enforcement:**
   - Free Tier: Limited to **1 active listing** at a time.
   - Pro Tier ($10/mo or $100/yr) & Admin: Unlimited active listings, featured top placement, and 24/7 emergency badge activation.
4. **Edge Crypto:** Always use `crypto.subtle` (native Web Crypto) for password hashing and verification. Avoid Node.js-only modules (`bcrypt`, `crypto` with sync calls) to ensure compatibility with Cloudflare Workers.
5. **Wrangler Configuration for Cloudflare Pages:**
   - **DO NOT** put `account_id` in `wrangler.jsonc` (Pages validator will reject the build).
   - **DO NOT** put variables in the `vars` block of `wrangler.jsonc` if they are already defined in the Cloudflare Pages dashboard (this causes duplicate binding errors).

---

## 6. Photo & Media Upload Pipeline

Photos are processed in two steps:
1. **Client-Side Compression:** [`src/client/utils/imageCompressor.ts`](file:///C:/Users/curtis/Desktop/dev/communitycentral/src/client/utils/imageCompressor.ts) downscales large smartphone photos to a maximum dimension of 1200px and converts them to modern `.webp` (quality 0.85). This reduces file sizes by 80-90% before transmission.
2. **Direct Edge Upload to R2:** [`ImageUploader.tsx`](file:///C:/Users/curtis/Desktop/dev/communitycentral/src/client/components/ImageUploader.tsx) posts the compressed image to `/api/media/upload`. The Hono router writes the buffer directly to Cloudflare R2 bucket `southwest-iowa-assets` and returns the permanent edge URL (`/api/media/uploads/...`).

---

## 7. Useful CLI Commands for Agents

```bash
# Typecheck TypeScript (zero errors required before commit)
npm run typecheck

# Production Vite build
npm run build

# Generate Drizzle migration after modifying src/db/schema.ts
npm run db:generate

# Execute migration against remote Cloudflare D1
$env:CLOUDFLARE_ACCOUNT_ID="0e528c886015cce349076fb7db222a88"
npx wrangler d1 execute southwest-iowa-db --remote --file=./drizzle/migrations/<migration_file>.sql

# Execute query against remote D1 database
npx wrangler d1 execute southwest-iowa-db --remote --command="SELECT count(*) FROM listings;"
```

---

## 8. Default Administrator Account

- **Email:** `curtis@builtnetworks.com`
- **Default Password:** `[REDACTED_PASSWORD_SEC]`
- **Role:** `admin` (global moderation, password resets, Pro license grants, safety queue takedowns)
- **Tier:** `pro_annual` (unlimited listings, priority featured placement)
