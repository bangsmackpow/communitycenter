# Password Management, Admin Pro Licensing, and Secret Leak Prevention Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide self-service password changing for all users, administrative password reset and Pro license granting/revocation in the admin interface, remove all cleartext credentials from repo documentation and code, and implement automated git hooks and CI scanning to prevent secret leaks.

**Architecture:**
- **Backend API (Hono v4):**
  - Add `POST /api/auth/change-password` allowing authenticated users to verify their current password and update to a new PBKDF2-hashed password.
  - Enhance `POST /api/admin/users/:id/grant-pro` to support granting (`pro_annual`, `pro_monthly`) or revoking (`free`) licenses with custom or default durations.
  - Remove hardcoded emails from `index.ts` and `routes/auth.ts`, replacing them with `c.env.ADMIN_EMAIL` / `c.env.ADMIN_EMAILS` environment bindings while preserving D1 database role privileges.
- **Frontend UI (React + Tailwind CSS):**
  - Add user-facing Account Security & Password Change dialog accessible from both the Navbar user pill (desktop & mobile) and Dashboard header.
  - Enhance Admin "User Management & Licenses" tab in `Dashboard.tsx` with a Pro License modal/actions (Grant 1-Year Pro, Grant 1-Month Pro, Revoke Pro) visible for all users, and prominent Password Reset buttons.
  - Ensure mobile navigation displays user profile and admin shortcuts without being hidden.
- **Security & Secret Prevention:**
  - Redact cleartext passwords and usernames from `AGENTS.md` and `README.md`.
  - Add automated secret scanner script (`scripts/check-secrets.js`) and pre-commit hook in `.githooks/pre-commit` configured via `core.hooksPath`.
  - Add GitHub Actions workflow (`.github/workflows/security-scan.yml`) to block commits containing secrets.
  - Sanitize git history to remove historic occurrences of the default admin password.

**Tech Stack:** React 18, TypeScript, Hono v4, Cloudflare D1/Workers Web Crypto (PBKDF2), Tailwind CSS, Lucide Icons, Git Hooks, GitHub Actions.

---

## Global Constraints
- Zero cold starts and edge-compatible crypto using `crypto.subtle` (no Node-only `bcrypt` or sync crypto).
- Guest-first experience: Visitors open the app with `currentUser === null`.
- Fair Housing compliance and clean directory ergonomics preserved.
- Zero TypeScript errors (`npm run typecheck`).

## Review Focus
- Attempting to change password with an incorrect current password should return a friendly error and not alter the stored hash.
- Password reset by admin should work immediately for any account (including the admin's own account) without needing the old password.
- Admin Pro license toggle should allow upgrading to Pro Annual, Pro Monthly, or downgrading to Free Tier immediately, with live UI state update.
- Secret scanning script should detect hardcoded passwords and block commits before push.
- Git history should be cleaned of cleartext passwords.

---

### Task 1: Self-Service Password Change Backend Endpoint & Admin License Grant Enhancement

**Files:**
- Modify: `src/server/routes/auth.ts`
- Modify: `src/server/routes/admin.ts`
- Modify: `src/server/index.ts`

- [ ] **Step 1: Add `POST /api/auth/change-password` in `src/server/routes/auth.ts`**
  - Accepts `{ currentPassword?: string, newPassword: string }` where `newPassword` has minimum 6 characters.
  - Verifies user authentication from context (`c.get('user')`).
  - Checks existing account password using `verifyPassword`.
  - Hashes new password via `hashPassword` and updates `schema.accounts`.
  - Returns `{ success: true, message: 'Password updated successfully.' }`.

- [ ] **Step 2: Enhance `POST /api/admin/users/:id/grant-pro` in `src/server/routes/admin.ts`**
  - Allow `tier: z.enum(['free', 'pro_monthly', 'pro_annual'])`.
  - If `free`, set `tier: 'free'` and `tierExpiresAt: null`.
  - If `pro_monthly` or `pro_annual`, calculate expiration from `durationDays` (default 365 for annual, 30 for monthly).
  - Update `schema.users` and return updated tier and expiration.

- [ ] **Step 3: Remove hardcoded emails from `src/server/index.ts` and `src/server/routes/auth.ts`**
  - Check `(c.env as any).ADMIN_EMAIL` / `ADMIN_EMAILS` (comma-delimited) instead of hardcoding `curtis@builtnetworks.com`.
  - If user email matches `ADMIN_EMAIL` or if user already has `role === 'admin'` in database, grant admin privileges.

- [ ] **Step 4: Typecheck backend changes**
  - Run `npm run typecheck` to verify no TypeScript compilation errors.

---

### Task 2: Frontend Self-Service Password Change UI & User Dropdown

**Files:**
- Create: `src/client/components/ChangePasswordModal.tsx`
- Modify: `src/client/components/Navbar.tsx`
- Modify: `src/client/views/Dashboard.tsx`
- Modify: `src/client/App.tsx`

- [ ] **Step 1: Create `src/client/components/ChangePasswordModal.tsx`**
  - Modal with fields: Current Password (if applicable), New Password, Confirm New Password.
  - Show/hide password toggles.
  - Client-side validation: matching passwords, minimum length 6 characters.
  - Submits to `POST /api/auth/change-password`.
  - Displays clear error or success alert.

- [ ] **Step 2: Add Account Menu in `src/client/components/Navbar.tsx`**
  - Make user profile pill clickable on all device sizes (mobile and desktop).
  - Clicking opens a profile menu or options:
    - "My Dashboard"
    - "Change Password"
    - "Admin Panel" (if admin)
    - "Sign Out"
  - Ensure mobile users have direct access to Dashboard and Admin Panel.

- [ ] **Step 3: Add "Change Password" button in `src/client/views/Dashboard.tsx` banner**
  - In the top account card of Dashboard, place a prominent button `Change Password` alongside the tier badge so users see their security controls immediately.

---

### Task 3: Admin Pro License Management & Password Reset UI in Dashboard

**Files:**
- Modify: `src/client/views/Dashboard.tsx`

- [ ] **Step 1: Build License Management Dialog / Dropdown in `Dashboard.tsx`**
  - On every user row in `User Management & Licenses`, show a "Manage License" / "Grant Pro" button (never hide it, even if already Pro).
  - Add modal or action popup to choose:
    - Grant 1-Year Pro Annual ($100 value)
    - Grant 1-Month Pro Monthly ($10 value)
    - Revoke Pro (Set to Free Tier)
  - Connect to `/api/admin/users/:id/grant-pro`.
  - Immediately update the user's tier badge and expiry in the UI list upon success.

- [ ] **Step 2: Enhance Admin Password Reset in `Dashboard.tsx`**
  - Clarify the "Reset Pass" modal:
    - Allow resetting password for any user or admin account.
    - Add "Generate Secure Password" helper button to instantly generate a strong random password.
    - Show copy-to-clipboard for the generated password.
    - Submit to `/api/admin/users/:id/reset-password`.

- [ ] **Step 3: Add Quick Admin Tab Selector**
  - Make sure the "User Management & Licenses" tab is distinctly highlighted with an admin badge.

---

### Task 4: Secret Leak Prevention & Scrubbing Cleartext Credentials

**Files:**
- Modify: `AGENTS.md`
- Modify: `README.md`
- Create: `scripts/check-secrets.js`
- Create: `.githooks/pre-commit`
- Create: `.github/workflows/security-scan.yml`
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Redact cleartext passwords & usernames in documentation**
  - Remove `curtis@builtnetworks.com` and default admin passwords from `AGENTS.md` (Section 8) and `README.md`.
  - Replace with documentation explaining how to set `ADMIN_EMAIL` in Cloudflare Pages environment variables and set admin passwords securely.

- [ ] **Step 2: Create secret scanning script `scripts/check-secrets.js`**
  - Scans staged git files or files on disk for high-risk patterns:
    - Hardcoded credentials (`password:`, `BuiltNetworks`, API secret keys, private keys).
    - Blocks commit if any secret pattern is found.

- [ ] **Step 3: Setup Git pre-commit hook and npm script**
  - Add `.githooks/pre-commit` running `node scripts/check-secrets.js`.
  - Configure `git config core.hooksPath .githooks`.
  - Add `"check:secrets": "node scripts/check-secrets.js"` to `package.json`.

- [ ] **Step 4: Create GitHub Actions security scan workflow**
  - Create `.github/workflows/security-scan.yml` running secret checks on push and PR.

- [ ] **Step 5: Sanitize Git History**
  - Rewrite git history to remove historic default passwords and replace with redacted placeholder in past commits so no cleartext passwords exist anywhere in the repository.

---

### Task 5: Verification & Testing

- [ ] **Step 1: Run typecheck and build**
  - `npm run typecheck`
  - `npm run build`
  - `npm run check:secrets`
- [ ] **Step 2: Test password change, license grant/revoke, and admin workflows**
  - Verify all interfaces and edge cases work seamlessly.
