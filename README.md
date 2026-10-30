# Southwest Iowa Community Central

[![Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![D1 SQLite](https://img.shields.io/badge/Database-Cloudflare%20D1-orange?logo=sqlite&logoColor=white)](https://developers.cloudflare.com/d1/)
[![R2 Storage](https://img.shields.io/badge/Storage-Cloudflare%20R2-yellow?logo=amazons3&logoColor=white)](https://developers.cloudflare.com/r2/)
[![Hono](https://img.shields.io/badge/API-Hono%20v4-E36002?logo=hono&logoColor=white)](https://hono.dev/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Tailwind-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

> Production-ready, edge-native community directory web platform and PWA tailored for **Southwest Iowa** (Creston, Corning, Afton, Greenfield, Osceola, Red Oak, Shenandoah, Clarinda, Atlantic, Mount Ayr, Winterset, and surrounding communities).

Connecting rural neighbors, property managers, independent trade contractors, and local community events on Cloudflare's Edge Runtime.

---

## 🌟 Key Features

### 1. Real Edge Infrastructure
- **Cloudflare Pages + Functions:** Globally distributed V8 edge compute with sub-millisecond cold starts.
- **Cloudflare D1 (SQLite) + Drizzle ORM:** Serverless relational SQLite database at the edge with typed Drizzle queries and automatic migrations.
- **Cloudflare R2 Object Storage (`southwest-iowa-assets`):** S3-compatible, zero-egress asset storage for listing photos with immutable edge caching.
- **Client-Side WebP Compression:** Images are compressed and resized (< 1200px) in the browser before being uploaded directly to R2.

### 2. Multi-Tier Business Model & Limiting Logic
- **Free Community Tier:** Every verified resident, landlord, or local small business can post **1 active listing** for free.
- **Pro Tier ($10/month or $100/year):**
  - Unlimited active listings for property management firms and busy contractors.
  - Top-of-feed featured badges and priority placement.
  - 24/7 Emergency Dispatch pills (Snow Removal, Emergency Furnace/Plumbing Repair).
  - Stripe Checkout integration with self-service Stripe Customer Portal.

### 3. Authentication & User Management
- **Guest-First Architecture:** Unauthenticated visitors start as clean guests (`currentUser = null`) with zero pre-filled test data.
- **Edge Password Auth:** Secure PBKDF2 SHA-256 (100,000 iterations) native Web Crypto password hashing.
- **Self-Service Password Changes:** Authenticated users can update their account password at any time via the profile menu or Dashboard banner.
- **1-Click Forgot Password & Token Reset:** Users can request a 1-click password reset link (`/?reset_token=...&email=...`) with 1-hour expiration.
- **OAuth Providers:** 1-click **Continue with Google** and **Continue with Facebook** authentication.
- **Admin Management Console:**
  - Dedicated **Admin: Users & Pro Licenses** panel accessible on both desktop and mobile.
  - **Create New Users:** Directly provision accounts with custom roles (`user`, `landlord`, `business`, `admin`), tiers (`free`, `pro_monthly`, `pro_annual`), and initial passwords.
  - **License Management:** 1-click controls to grant 1-Year Pro Annual ($100 value), 1-Month Pro Monthly ($10 value), or revoke Pro back to Free tier.
  - **Password Overrides:** Reset any user's password with a built-in strong password generator (`🎲 Generate Strong`).
  - Search any user by name or email with live status badges and expiration dates.

### 4. Community Safety, Trust & Disclaimers
- **Anti-Scam Alert Banners:** Displayed on all rental listings warning against wire-transfer and gift-card scams.
- **Safety Report / Flagging Pipeline:** Users can report suspicious postings (`scam`, `outdated`, `duplicate`, `inappropriate`) with optional notes.
- **Admin Moderation Queue:** Live queue in the dashboard allowing admins to review reports and permanently take down scam postings with one click.
- **Equal Housing Opportunity Disclaimer:** Federal Fair Housing Act compliance disclaimers and policies in the footer.
- **Contractor Licensure Disclaimer:** Explicit notices encouraging homeowners to verify contractor insurance and credentials.

### 5. Localized Small-Town UX & Mobile PWA
- **Sticky Town Selector:** Filter listings across Creston, Corning, Afton, Greenfield, Osceola, Red Oak, Shenandoah, Clarinda, Atlantic, Mount Ayr, Lenox, Bedford, Villisca, and Winterset.
- **Direct 1-Tap Action Dock:** Native `Call Now` (`tel:`), `Text SMS` (`sms:`), and in-app **Online Inquiry** message dispatch.
- **iCalendar Export:** Download `.ics` event files directly into Apple Calendar, Google Calendar, or Outlook for community benefits and sports.
- **Community Suggestions:** Crowdsourcing tool allowing neighbors to suggest unlisted local businesses or propose edits to existing listings.
- **Light & Dark Mode:** Light mode by default; dark mode selectable with persistent `localStorage` preference.
- **PWA Ready:** Web App Manifest + Service Worker configured for "Add to Home Screen" on iOS and Android.

---

## 🛠️ Stack & Directory Structure

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
│   │   └── schema.ts            # Drizzle ORM SQLite schema (Users, Listings, Media, Reports, Inquiries)
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
│   │       ├── events.ts        # .ics calendar generator for community events
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

## 🚀 Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Vite Frontend Server
```bash
npm run dev
```

### 3. TypeScript Typecheck
```bash
npm run typecheck
```

### 4. Secret & Credential Leak Scan
```bash
npm run check:secrets
```

### 5. Build for Production
```bash
npm run build
```

---

## ☁️ Cloudflare Pages & Deployment Guide

The application is deployed on Cloudflare Pages connected to your GitHub repository (`bangsmackpow/communitycenter`).

### 1. Cloudflare D1 Database Binding
In the Cloudflare Dashboard under **Pages > Your Project > Settings > Functions > D1 database bindings**:
- **Variable name:** `DB`
- **D1 Database:** `southwest-iowa-db` (`51b6cf8c-abf4-4f54-a546-2234b44dff35`)

### 2. Cloudflare R2 Bucket Binding
In the Cloudflare Dashboard under **Pages > Your Project > Settings > Functions > R2 bucket bindings**:
- **Variable name:** `BUCKET`
- **R2 Bucket:** `southwest-iowa-assets`

### 3. Environment Variables
Add the following in **Pages > Settings > Environment variables**:

| Variable Name | Description | Example / Source |
| :--- | :--- | :--- |
| `BETTER_AUTH_SECRET` | 32+ character random secret string | `southwest_iowa_dev_secret_key_edge_32chars_min` |
| `BETTER_AUTH_URL` | Production website base URL | `https://communitycenter.pages.dev` |
| `GOOGLE_CLIENT_ID` | Google OAuth Web Client ID | From [Google Cloud Console](https://console.cloud.google.com/) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | From Google Cloud Console |
| `FACEBOOK_CLIENT_ID` | Meta / Facebook App ID | From [Meta for Developers](https://developers.facebook.com/) |
| `FACEBOOK_CLIENT_SECRET`| Meta / Facebook App Secret | From Meta for Developers |
| `STRIPE_SECRET_KEY` | Stripe Secret API Key | `sk_live_...` or `sk_test_...` from [Stripe](https://dashboard.stripe.com/) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Signing Secret | `whsec_...` from Stripe Webhooks |

---

## 🔑 Administrator Setup

To designate administrator accounts with global privileges (including the **Manage Users & Licenses** dashboard, safety report takedown queue, and Pro license assignment):

1. Add the `ADMIN_EMAIL` (or comma-separated `ADMIN_EMAILS`) environment variable in your Cloudflare Pages Dashboard under **Settings > Environment Variables**:
   ```
   ADMIN_EMAIL=your-admin@example.com
   ```
2. When registering or signing in with this email, the account is automatically provisioned with the `admin` role and `pro_annual` tier.
3. Passwords can be changed directly from the in-app user account menu (**Change Password**).
4. Never store or commit cleartext passwords or secrets to this repository. Automated git pre-commit hooks and CI scans prevent unencrypted credentials from being pushed.

---

## 🗄️ Database Management & Seeding

### Execute Migrations Against Remote D1:
```bash
$env:CLOUDFLARE_ACCOUNT_ID="0e528c886015cce349076fb7db222a88"
npx wrangler d1 execute southwest-iowa-db --remote --file=./drizzle/migrations/0002_mushy_fenris.sql
```

### Seed Authentic Southwest Iowa Starter Data:
```bash
$env:CLOUDFLARE_ACCOUNT_ID="0e528c886015cce349076fb7db222a88"
npx wrangler d1 execute southwest-iowa-db --remote --file=./seed_remote.sql
```

---

## 📄 License & Ownership

Copyright © 2026 Built Networks LLC. Built specifically for Southwest Iowa communities.
All rights reserved.
