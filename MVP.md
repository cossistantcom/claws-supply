# Claws.supply — MVP Technical Specification

> **Purpose:** This document defines the complete MVP for **Claws.supply**, a marketplace for OpenClaw.ai agent templates. It is written for an AI coding agent to implement end-to-end.
>
> **Stack:** Next.js 14+ (App Router) · Drizzle ORM · PostgreSQL · Better Auth (already set up) · Stripe Connect · Vercel Blob (public + private stores)

---

## Build Progress

- [x] DONE — Better Auth supports standalone sign-in/sign-up with X and unique usernames; org plugin removed; no subscriptions.
- [x] DONE — Drizzle schema aligned with MVP marketplace domain (users/templates/purchases/reviews/commission overrides).
- [x] DONE — Profile foundation shipped (`/profile`) with name/bio editing, read-only username, image+facehash avatar fallback, X linking, Stripe onboarding/status, and destructive account deletion.
- [x] DONE — Profile API baseline shipped:
  - `GET/PATCH/DELETE /api/profile`
  - `POST /api/profile/x/connect`
  - `POST /api/profile/stripe/connect`
  - `GET /api/profile/stripe/status`
- [x] DONE — Template lifecycle mutation API shipped with Zod validation and owner/admin authorization:
  - `PATCH /api/templates/[slug]` (edit metadata)
  - `POST /api/templates/[slug]/publish` (publish first version)
  - `POST /api/templates/[slug]/unpublish`
  - `DELETE /api/templates/[slug]` (soft delete via lifecycle status)
- [x] DONE — Blob architecture migrated to dual-store Vercel Blob client upload:
  - Public covers via `BLOB_READ_WRITE_TOKEN`
  - Private template zip artifacts via `PRIVATE_READ_WRITE_TOKEN`
  - Handle endpoints:
    - `POST /api/templates/[slug]/uploads/cover-handle`
    - `POST /api/templates/[slug]/uploads/template-handle`
- [x] DONE — Secure private download route shipped:
  - `GET /api/templates/[slug]/download` streams private blob server-side (no public/private signed URL exposed to client).
- [x] DONE — Reusable frontend upload primitives shipped:
  - `useBlobUpload` hook + modular `FileUploadField`, `ZipUploadField`, and `CoverUploadField`.
- [x] DONE — Template read/list pipeline shipped end-to-end (DB-backed, mock-free):
  - `GET /api/templates` with query support for `category`, `sort`, `page`, `limit`, `freeOnly`, and backend-ready `search`
  - `GET /api/templates/[slug]` returns public template detail (seller + aggregate stats + related templates)
  - Public discovery/category/detail pages now SSR-prefetch from shared read service (no `lib/mock/templates.ts` dependency)
  - `sitemap.xml` template URLs now source from published DB records
- [x] DONE — CLI-first template creation flow shipped:
  - New protected API surface under `/api/cli/v1/*` for auth, slug checks, zip upload token issuance, and signed draft creation
  - Better Auth device-authorization flow enabled with verification page at `/cli/auth/device`
  - Template signing fields shipped on `template`: `publisher_hash` + `archive_hash`
  - Zip/version upload from web endpoints is blocked (`410`) and template creation via `POST /api/templates` is removed
- [x] DONE — Seller lifecycle management UI shipped:
  - Owner/admin management panel on `/openclaw/template/[templateSlug]` with save/publish/unpublish/delete actions
  - Template zip/version upload actions are CLI-only
  - Draft/unpublished templates return 404 for non-owner/non-admin viewers
- [x] DONE — Versioning migrated to integer sequential model with release notes:
  - `template.version` and `template_version.version` are integers
  - New note fields: `template.version_notes` and `template_version.release_notes`
  - Zip uploads/version publish enforce sequential increments (`+1`)
- [x] DONE — Commission defaults centralized and rendered in UI:
  - Browsing sales: 30% platform commission
  - Direct-link sales: 20% platform commission
  - Direct referral window: 90 days
- [x] DONE — Advertising subscriptions v1 shipped:
  - Public sales + authenticated campaign management page at `/advertise`
  - Ad campaign schema + migration (`ad_campaign`, `stripe_webhook_event`, enums/indexes/constraints)
  - Ads APIs shipped: `GET /api/ads/availability`, `GET/POST /api/ads/campaign`, `POST /api/ads/campaign/cancel`, `POST /api/ads/logo-handle`
  - Stripe ads webhook lifecycle sync shipped at `POST /api/stripe/webhooks`
  - Sponsored rendering shipped for sidebar and in-grid results cards
  - Legal updates shipped for advertising subscriptions/moderation in terms + policy pages
- [x] DONE — Members community surfaces shipped:
  - Public members directory at `/members` with server-rendered search (`q`) and pagination (`page`)
  - Public member SEO profile pages at `/members/[username]` with verification checklist and published template grid
  - Shared verification function centralized and reused across profile settings + template seller mapping
  - Right sidebar community module added above ad block:
    - `X people joined in the last 24 hours`
    - latest 10 member avatars linking to member profiles
  - Facehash avatar fallback reused for all public member surfaces
  - `MEMBERS` top-nav link shipped
  - Sitemap now includes `/members` + all `/members/{username}` pages

### Short Tech Notes (Implemented)

- Auth/OAuth: X linking uses Better Auth directly (`twitter` provider via `linkSocialAccount`); no custom OAuth flow.
- Profile API contract: uniform JSON envelope `{ data }` on success and `{ error: { code, message } }` on failure.
- Permissions/utilities: shared helpers in `lib/auth/session.ts` and `lib/auth/permissions.ts` for route protection and owner/admin checks.
- Profile mutation guardrails: username is immutable in profile APIs; only `name` and `bio` are writable.
- Deletion behavior: Better Auth `deleteUser` enabled; deletion route follows Better Auth fresh-session protection.
- Stripe behavior: onboarding link creation + status sync updates `stripeVerified` from live Stripe account flags.
- Env compatibility: prefer `X_CLIENT_ID/X_CLIENT_SECRET` with fallback to legacy typo vars (`TWITER_*`).
- CLI auth decision: device authorization uses Better Auth plugin with allowlisted client IDs from `CLI_DEVICE_CLIENT_IDS` (default: `claws-supply-cli`).
- CLI transport decision: zip upload uses direct-to-Blob client tokens + finalize API (no large multipart body through Vercel route handlers).
- CLI signing decision: finalize verifies archive hash, manifest schema, manifest publisher hash, and per-file hashes before draft insert.
- Template lifecycle model: draft-first with explicit status transitions (`draft` → `published` → `unpublished` / `deleted`).
- Template upload policy is centralized: allowed MIME, max size, path validation, TTL, and per-asset store token are all shared in template blob helpers.
- Upload security decision: Vercel client upload callbacks use raw request body (for signature verification), while still validating shape with Zod.
- Pricing guardrail: paid pricing (`priceCents > 0`) requires seller Stripe verification, including when action is triggered by admin.
- Description guardrail: markdown is normalized on write; `#` and `##` headings are auto-demoted to `###`.
- Versioning decision: template versioning uses sequential integer versions (`1, 2, 3, ...`) with per-version release notes.
- Commission decision: default rates are direct `20%`, browsing `30%`, with a `90` day referral attribution window.
- Ads constants decision: campaign inventory, placement pricing, and Stripe price-id source of truth are centralized in `lib/ads/constants.ts`.
- Ads lifecycle decision: renderability, capacity reservation, and final subscription-state logic are centralized in `lib/ads/domain.ts`.
- Ads read-path decision: availability reads, campaign reads, sidebar/results render queries, and sponsored feed insertion composition are centralized in `lib/ads/read-service.ts`.
- Ads Stripe routing decision: sandbox vs production price IDs are resolved from the Stripe secret key environment and override env variables.
- Read architecture decision: one shared template read service powers both SSR pages and API handlers; no server-side internal HTTP fetch layer.
- Runtime DB decision: query/mutation paths use Drizzle query builder only (no raw `sql` fragments in runtime services/routes). Raw SQL remains limited to Drizzle schema constraints and migration files.
- Download counter decision: increments use a Drizzle transaction with row lock (`FOR UPDATE`) and deterministic writeback.
- Member verification decision: `isVerified` is centralized in a shared helper and computed from `(X linked) && (Stripe verified)` everywhere.
- Member privacy decision: public member read paths only select safe fields (`id`, `username`, `name`, `bio`, `image`, verification flags, timestamps); email is never exposed.
- Migration prerequisite: local/dev must run latest Drizzle migrations before app runtime (`bun run migrate`) so lifecycle columns like `template.status` exist.
- Current gap snapshot:
  - Checkout/purchase routes + Stripe webhook purchase creation are still pending.
  - Review routes are still pending.
  - Dedicated `/api/members` and `/api/members/[username]` endpoints are still pending (public pages currently read server-side directly).
  - Automated tests for lifecycle/read/blob/payment flows are still pending.

---

## 1. Product Overview

### What is Claws.supply?

Claws.supply is a marketplace where OpenClaw.ai users can publish, discover, and purchase pre-configured agent templates. A "template" is a zip archive containing an OpenClaw agent image with pre-setup skills, capabilities, goals, and knowledge — but **no memory or private user data**.

Templates let users skip the configuration phase and instantly bootstrap a specialized AI agent in any domain (marketing, dev, sales, etc.).

### Core Value Proposition

- **Buyers:** One-click quickstart with a pre-configured OpenClaw agent — no domain expertise required.
- **Sellers:** Monetize agent configurations. Share via direct link (20% platform commission) or let the marketplace drive discovery (30% commission).
- **Platform:** Programmatic SEO powerhouse with category pages, template pages, and member profiles.

---

## 2. User Roles & Permissions

### 2.1 Roles

| Role              | Description                                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Visitor**       | Unauthenticated. Can browse templates, categories, member profiles. Cannot purchase or review.                          |
| **User**          | Authenticated via email/password or X OAuth. Can purchase templates, leave reviews (if eligible).                       |
| **Seller**        | A User who has connected Stripe (via Stripe Connect onboarding). Can publish templates and receive payouts.             |
| **Verified User** | A Seller who has completed Stripe identity verification AND connected their X account. Displayed with a verified badge. |
| **Admin**         | Internal team. Can flag/remove templates, adjust per-user commission rates, manage categories.                          |

### 2.2 Verification Criteria

A user is **verified** when ALL of the following are true:

- Stripe Connect account is active and identity-verified
- X (Twitter) account is linked via OAuth

Verified status is displayed on their member profile and next to reviews.

---

## 3. Authentication

> **Note:** Better Auth is already set up. Extend the existing configuration.

### 3.1 Auth Methods

| Method                | Flow                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Email + Password**  | Standard sign-up / sign-in with email verification                                                                 |
| **X (Twitter) OAuth** | Standalone sign-up/sign-in method. If the user signs in with X, their handle seeds the username (with unique suffix fallback when needed). |

### 3.2 Auth-Related Data on User

The user record needs to track the following auth-related fields (in addition to whatever Better Auth manages):

- **X link:** X/Twitter user ID, X handle (e.g. "johndoe"), timestamp of linking
- **Stripe:** Stripe Connect account ID, whether identity verification is complete (boolean)
- **Computed — isVerified:** true when Stripe is verified AND X account is linked
- **Role:** "user" (default) or "admin"

### 3.3 X Sign-Up / Sign-In Flow

1. User chooses "Continue with X" from sign-in/sign-up
2. Redirect to X OAuth 2.0 flow
3. On callback, create/sign in user and store `xAccountId`, `xUsername`, and `xLinkedAt`
4. Username is seeded from X handle (and auto-suffixed when a collision occurs)

---

## 4. Database Schema

> Use Drizzle ORM with PostgreSQL. The agent is responsible for choosing appropriate column types, primary keys, indexes, and constraints based on the requirements below.

### 4.1 Users (extend Better Auth)

Better Auth already manages core auth fields (id, email, password hash, sessions, etc.). The following additional data needs to be tracked per user:

- **Profile:** unique username (for URLs), display name, bio, avatar URL
- **X (Twitter) link:** X account ID, X handle, timestamp of when they linked
- **Stripe Connect:** Stripe account ID, whether Stripe identity verification is complete
- **Role:** user or admin (default: user)
- **Computed — isVerified:** true when BOTH Stripe is verified AND X account is linked
- **Timestamps:** created, updated

> Username must be unique and URL-safe (used in `/members/{username}` and `?ref={username}`).

### 4.2 Templates

Each template represents a published OpenClaw agent configuration. Track:

- **Ownership:** which user (seller) created it
- **Identity:** unique URL slug (for SEO), title
- **Content:** full description (supports markdown), short description (for cards/listings)
- **Pricing:** price in cents (0 = free), currency (default USD)
- **Classification:** category (must match one of the `CATEGORIES` constants — see 4.6)
- **Files:** private blob pathname for current zip artifact, file size in bytes, optional public cover image URL
- **Lifecycle:** `status` (`draft`, `published`, `unpublished`, `deleted`) + `publishedAt`, `unpublishedAt`, `deletedAt`
- **Versioning:** current integer version (`1, 2, 3, ...`)
- **Moderation:** flagged status (boolean), flag reason (set by admin)
- **Stats:** download count
- **Timestamps:** created, updated

> Slug must be globally unique and immutable after creation. Index on: seller, category, slug, status, flagged status, created date.

Template versions are persisted in a separate `template_version` table:

- `templateId`, `version`, `zipObjectKey`, `fileSizeBytes`, `createdByUserId`, timestamps
- unique constraint on `(templateId, version)`

### 4.3 Purchases

Each purchase is a record of a buyer acquiring access to a template. Track:

- **Parties:** buyer, seller, template
- **Financials:** price at time of purchase (in cents), commission rate applied (%), platform fee amount (cents), seller payout amount (cents)
- **Attribution:** sale type ("direct" or "browsing"), referral code (the `?ref=` value if present)
- **Stripe:** PaymentIntent ID, Transfer ID (to seller)
- **Status:** pending, completed, or failed
- **Timestamp:** created

> **Constraint:** A buyer can only purchase a given template once (unique on buyer + template). Free templates (price = 0) still create a purchase record for tracking and review eligibility.

### 4.4 Reviews

Users can leave one review per template. Track:

- **Links:** which template, which user
- **Content:** rating (integer 1-5), optional title (max ~200 chars), optional body (free text)
- **Trust signal:** whether the reviewer has a verified purchase of this template
- **Timestamps:** created, updated

> **Constraint:** One review per user per template (unique on template + user).

### 4.5 Commission Overrides

Admins can set custom commission rates for specific sellers (e.g., influencer deals). Track:

- **Target:** which user this override applies to (one override per user)
- **Rates:** custom direct sale rate (%), custom browsing sale rate (%)
- **Context:** admin notes explaining the override, which admin created it
- **Timestamps:** created, updated

> If no override exists for a seller, the system uses defaults (direct: 20%, browsing: 30%).

### 4.6 Categories (Constants — Not a Table)

Categories are defined as a **TypeScript constant array**, not a database table. This keeps them fast, type-safe, and manually curated.

```typescript
// src/lib/categories.ts

export const CATEGORIES = [
  {
    slug: "marketing",
    label: "Marketing",
    description: "SEO, content, ads, social media agents",
  },
  {
    slug: "sales",
    label: "Sales",
    description: "Outreach, lead gen, CRM automation agents",
  },
  {
    slug: "development",
    label: "Development",
    description: "Coding, devops, testing agents",
  },
  {
    slug: "writing",
    label: "Writing",
    description: "Copywriting, blogging, documentation agents",
  },
  {
    slug: "research",
    label: "Research",
    description: "Data analysis, market research, competitive intel agents",
  },
  {
    slug: "customer-support",
    label: "Customer Support",
    description: "Helpdesk, FAQ, ticket triage agents",
  },
  {
    slug: "design",
    label: "Design",
    description: "UI/UX, branding, creative direction agents",
  },
  {
    slug: "productivity",
    label: "Productivity",
    description: "Task management, scheduling, workflow agents",
  },
  {
    slug: "finance",
    label: "Finance",
    description: "Accounting, forecasting, financial analysis agents",
  },
  {
    slug: "other",
    label: "Other",
    description: "Agents that don't fit other categories",
  },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
```

> **To add a category:** Add an entry to this array + deploy. No migration needed.

---

## 5. File Storage

### 5.1 Storage Strategy

Use two Vercel Blob stores (token-separated):

- `BLOB_READ_WRITE_TOKEN` for public assets (covers, public images)
- `PRIVATE_READ_WRITE_TOKEN` for private template zip artifacts

Blob path conventions:

```text
templates/public/covers/{sellerId}/{templateSlug}/{timestamp}-{random}-{filename}
templates/private/zips/{sellerId}/{templateSlug}/v{version}.zip
```

Notes:

- Cover uploads are public and cacheable.
- Template zip uploads are private, versioned, and immutable (`allowOverwrite: false`).

### 5.2 Upload Flow

Upload uses Vercel **Client Upload** with separate handle routes:

1. Client requests token via handle route:
   - `POST /api/templates/[slug]/uploads/cover-handle`
   - `POST /api/templates/[slug]/uploads/template-handle`
2. Server validates session + owner/admin authorization + lifecycle state (not deleted).
3. Server enforces pathname policy, MIME allowlist, max file size, and short token TTL.
4. Client uploads directly to Blob (no server-byte proxy, lower infra cost).
5. Publish/edit routes verify uploaded blobs with `head()` before persisting references.

### 5.3 Download Flow

Template downloads are server-mediated for security:

1. Client calls `GET /api/templates/[slug]/download` (auth required).
2. Backend verifies template is published and not deleted.
3. Backend authorizes actor:
   - seller/admin
   - buyer with completed purchase
   - authenticated user when template is free (`priceCents === 0`)
4. Backend fetches private blob with server token and streams response with attachment headers.
5. `downloadCount` increments only after blob fetch starts successfully.

No shareable pre-signed blob download URL is returned to client.

### 5.4 Versioning

- Sellers can upload a new version of an existing template
- New zip is stored as deterministic immutable pathname `v{version}.zip`
- Semver must be monotonic (`newVersion > currentVersion`)
- New row is inserted into `template_version`; template's current version pointer is updated
- **All past buyers can download the latest version** — the purchase record grants access to any version

---

## 6. Payments & Commissions (Stripe Connect)

### 6.1 Stripe Connect Onboarding

1. User clicks "Start Selling" → backend creates a Stripe Connect **Express** account
2. Redirect user to Stripe's hosted onboarding flow
3. On completion, Stripe sends webhook → update `stripe_account_id` and `stripe_verified`
4. User is now a Seller

### 6.2 Purchase Flow

```
1. Buyer clicks "Buy" on template page
2. Determine sale_type:
   - If URL has ?ref={sellerUsername} → sale_type = "direct"
   - Otherwise → sale_type = "browsing"
3. Look up commission rate:
   a. Check commission_overrides for this seller
   b. If no override → use defaults (direct: 20%, browsing: 30%)
4. Create Stripe Checkout Session:
   - application_fee_amount = price * (commission_rate / 100)
   - transfer_data.destination = seller's stripe_account_id
5. On successful payment (webhook: checkout.session.completed):
   a. Create purchase record
6. Buyer can now download the template
```

`download_count` is incremented on successful download stream start (`GET /api/templates/[slug]/download`), not on checkout completion.

### 6.3 Commission Defaults

| Sale Type                 | Default Commission | Meaning                                     |
| ------------------------- | ------------------ | ------------------------------------------- |
| **Direct** (has `?ref=`)  | 20% to platform    | Seller drove the traffic. Seller keeps 80%. |
| **Browsing** (no `?ref=`) | 30% to platform    | Platform drove discovery. Seller keeps 70%. |

### 6.4 Commission Overrides (Admin)

Admins can set per-user commission rates via the `commission_overrides` table. This is used for influencer deals, partnerships, etc.

- Override applies to BOTH direct and browsing rates independently
- If no override exists for a seller, defaults are used
- Resolution: `commission_overrides[seller.id] ?? DEFAULT_RATES`

### 6.5 Free Templates

- If `price_cents === 0`, skip Stripe entirely
- Create a purchase record with `price_cents = 0`, `commission = 0`
- Buyer gets immediate download access

### 6.6 Referral Link Format

Sellers share links like:

```
https://claws.supply/openclaw/template/{templateSlug}?ref={sellerUsername}
```

The `ref` parameter is:

- Stored in a cookie (90-day TTL) on first visit, so it persists if the buyer doesn't purchase immediately
- Validated: must match the template's seller username
- If `ref` is present but doesn't match the seller → treat as browsing sale (prevents gaming)

---

## 7. API Routes

> All routes use Next.js App Router Route Handlers (`app/api/...`). Auth is enforced via Better Auth session middleware.

### 7.1 Auth Routes

Better Auth handles these. Extend for X OAuth linking:

| Method   | Route                  | Auth | Description                                    |
| -------- | ---------------------- | ---- | ---------------------------------------------- |
| `GET`    | `/api/auth/x/link`     | ✅   | Initiate X OAuth to link account               |
| `GET`    | `/api/auth/x/callback` | ✅   | X OAuth callback — store xAccountId, xUsername |
| `DELETE` | `/api/auth/x/unlink`   | ✅   | Remove X account link                          |

### 7.2 Template Routes

Template API conventions (implemented):

- Success envelope: `{ data: ... }`
- Error envelope: `{ error: { code, message } }`
- Request validation: Zod schemas only
- Mutations: session required + owner/admin authorization
- Slug: immutable after creation

| Method   | Route                                         | Auth                | Status      | Description                                                                                                                                                                  |
| -------- | --------------------------------------------- | ------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/api/templates`                              | ❌                  | ✅ Shipped  | List published templates. Query params: `category`, `sort` (newest, popular, price_asc, price_desc), `page`, `limit`, `freeOnly`, `search` (backend-ready for phase 2 UI). |
| `GET`    | `/api/templates/[slug]`                       | ❌                  | ✅ Shipped  | Get single public template by slug. Includes seller info, aggregate stats, and related templates.                                                                            |
| `POST`   | `/api/templates`                              | ✅ User             | ❌ Removed  | Removed. Template creation is now CLI-only via `/api/cli/v1/templates/publish`.                                                                                              |
| `PATCH`  | `/api/templates/[slug]`                       | ✅ Owner/Admin      | ✅ Shipped  | Edit mutable metadata only (slug immutable). Supports metadata + `coverUpload` + `versionNotes` updates.                                                                   |
| `POST`   | `/api/templates/[slug]/publish`               | ✅ Owner/Admin      | ✅ Shipped  | Publish existing draft artifact with optional `{ coverUpload?, versionNotes? }`.                                                                                            |
| `POST`   | `/api/templates/[slug]/versions/publish`      | ✅ Owner/Admin      | ⚠️ Blocked  | Returns `410` (`CLI_ONLY_ZIP_VERSION_UPLOAD`). Zip/version artifact publishing is CLI-only.                                                                                 |
| `POST`   | `/api/templates/[slug]/unpublish`             | ✅ Owner/Admin      | ✅ Shipped  | Unpublish currently published template.                                                                                                                                      |
| `DELETE` | `/api/templates/[slug]`                       | ✅ Owner/Admin      | ✅ Shipped  | Soft delete by setting lifecycle status to `deleted`.                                                                                                                        |
| `POST`   | `/api/templates/[slug]/uploads/cover-handle`  | ✅ Owner/Admin\*    | ✅ Shipped  | Vercel Blob client-upload handle route for public cover images (`BLOB_READ_WRITE_TOKEN`).                                                                                   |
| `POST`   | `/api/templates/[slug]/uploads/template-handle` | ✅ Owner/Admin\*  | ⚠️ Blocked  | Returns `410` (`CLI_ONLY_ZIP_UPLOAD`). Zip artifact upload is CLI-only.                                                                                                     |
| `GET`    | `/api/templates/[slug]/download`              | ✅ Authenticated    | ✅ Shipped  | Streams private zip from server. Access allowed for seller/admin, buyers with completed purchase, and authenticated users for free templates.                               |

\* Upload-completed callback events are signed by Vercel Blob and validated by `handleUpload`; no session cookie is required for that callback event.

Deprecated/removed routes:

- `POST /api/templates/[slug]/upload-url` (removed)
- `PUT /api/templates/uploads` (removed)
- `POST /api/templates` (removed; replaced by CLI publish finalize)

### 7.2.1 CLI Routes (`/api/cli/v1`)

| Method | Route | Auth | Status | Description |
| ------ | ----- | ---- | ------ | ----------- |
| `POST` | `/api/cli/v1/auth/device/code` | ❌ | ✅ Shipped | Starts Better Auth device flow and returns device/user code payload. |
| `POST` | `/api/cli/v1/auth/device/token` | ❌ | ✅ Shipped | Polls device flow, returns bearer token payload and computed `publisherHash`. |
| `POST` | `/api/cli/v1/auth/device/approve` | ✅ Session | ✅ Shipped | Browser approval endpoint for pending device codes. |
| `POST` | `/api/cli/v1/auth/device/deny` | ✅ Session | ✅ Shipped | Browser deny endpoint for pending device codes. |
| `GET` | `/api/cli/v1/templates/slug-availability` | ✅ Bearer | ✅ Shipped | Validates CLI slug availability before build/publish. |
| `POST` | `/api/cli/v1/templates/uploads/zip-token` | ✅ Bearer | ✅ Shipped | Issues constrained private Blob client token for deterministic `v1.zip` uploads. |
| `POST` | `/api/cli/v1/templates/publish` | ✅ Bearer | ✅ Shipped | Finalizes signed upload and creates draft with stored `publisher_hash` + `archive_hash`. |

### 7.3 Purchase Routes

| Method | Route                           | Auth | Description                                                            |
| ------ | ------------------------------- | ---- | ---------------------------------------------------------------------- |
| `POST` | `/api/purchases/checkout`       | ✅   | Create Stripe Checkout session. Body: `{ templateSlug, ref? }`         |
| `GET`  | `/api/purchases`                | ✅   | List current user's purchases. Includes template info for re-download. |
| `GET`  | `/api/purchases/[templateSlug]` | ✅   | Check if current user owns a specific template                         |

### 7.4 Review Routes

| Method   | Route                           | Auth           | Description                                                                                                         |
| -------- | ------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/api/templates/[slug]/reviews` | ❌             | List reviews for a template. Paginated.                                                                             |
| `POST`   | `/api/templates/[slug]/reviews` | ✅             | Create a review. **Gated:** user must be verified OR have purchased the template. Body: `{ rating, title?, body? }` |
| `PATCH`  | `/api/reviews/[reviewId]`       | ✅ Owner       | Update own review                                                                                                   |
| `DELETE` | `/api/reviews/[reviewId]`       | ✅ Owner/Admin | Delete a review                                                                                                     |

### 7.5 User / Member Routes

| Method  | Route                     | Auth | Description                                                                      |
| ------- | ------------------------- | ---- | -------------------------------------------------------------------------------- |
| `GET`   | `/api/members`            | ❌   | List members with stats. Query: `page`, `limit`, `sort` (newest, most_templates) |
| `GET`   | `/api/members/[username]` | ❌   | Get member profile (templates, join date, verified status, bio, X link)          |
| `PATCH` | `/api/users/me`           | ✅   | Update profile (displayName, bio, username, avatar)                              |

### 7.6 Stripe Routes

| Method | Route                        | Auth | Description                                                       |
| ------ | ---------------------------- | ---- | ----------------------------------------------------------------- |
| `POST` | `/api/stripe/connect`        | ✅   | Create Stripe Connect account + return onboarding URL             |
| `GET`  | `/api/stripe/connect/status` | ✅   | Check Stripe account status (onboarding complete, verified, etc.) |
| `POST` | `/api/stripe/webhooks`       | ❌\* | Stripe webhook handler. \*Verified via Stripe signature.          |

### 7.7 Admin Routes

| Method   | Route                                      | Auth     | Description                                                        |
| -------- | ------------------------------------------ | -------- | ------------------------------------------------------------------ |
| `POST`   | `/api/admin/templates/[slug]/flag`         | ✅ Admin | Flag/unflag a template. Body: `{ flagged: boolean, reason? }`      |
| `GET`    | `/api/admin/commission-overrides`          | ✅ Admin | List all commission overrides                                      |
| `POST`   | `/api/admin/commission-overrides`          | ✅ Admin | Set override. Body: `{ userId, directRate, browsingRate, notes? }` |
| `DELETE` | `/api/admin/commission-overrides/[userId]` | ✅ Admin | Remove override (revert to defaults)                               |

### 7.8 Ads Routes

| Method | Route                         | Auth | Description                                                                 |
| ------ | ----------------------------- | ---- | --------------------------------------------------------------------------- |
| `GET`  | `/api/ads/availability`       | ❌   | Returns slot limit, occupied count, spots left, pricing metadata, and price IDs. |
| `GET`  | `/api/ads/campaign`           | ✅   | Returns the current authenticated user's campaign summary, or `null`.       |
| `POST` | `/api/ads/campaign`           | ✅   | Validates creative/placement, enforces capacity, and returns Stripe Checkout URL. |
| `POST` | `/api/ads/campaign/cancel`    | ✅   | Schedules cancellation at period end (`cancel_at_period_end=true`).         |
| `POST` | `/api/ads/logo-handle`        | ✅   | Vercel Blob SVG upload handle route with path/MIME/size guardrails.         |

---

## 8. Page Structure & SEO

### 8.1 Route Map

```
app/
├── page.tsx                                    → /                           (Homepage)
├── advertise/
│   └── page.tsx                                → /advertise                  (Advertising sales + campaign management)
├── openclaw/
│   ├── templates/
│   │   ├── [category]/
│   │   │   └── page.tsx                        → /openclaw/templates/{category}  (Category browse)
│   │   └── publish-via-cli/
│   │       └── page.tsx                        → /openclaw/templates/publish-via-cli  (CLI publishing guide)
│   └── template/
│       └── [templateSlug]/
│           └── page.tsx                        → /openclaw/template/{slug}       (Template detail)
├── members/
│   ├── page.tsx                                → /members                       (Members directory)
│   └── [username]/
│       └── page.tsx                            → /members/{username}            (Member profile)
├── dashboard/
│   ├── page.tsx                                → /dashboard                     (My purchases)
│   ├── templates/
│   │   └── page.tsx                            → /dashboard/templates           (My listed templates)
│   └── settings/
│       └── page.tsx                            → /dashboard/settings            (Profile, X link, Stripe)
├── cli/
│   └── auth/
│       └── device/
│           └── page.tsx                        → /cli/auth/device               (Device flow approval page)
├── auth/
│   ├── sign-in/page.tsx                        → /auth/sign-in
│   └── sign-up/page.tsx                        → /auth/sign-up
└── api/
    └── ... (see Section 7)
```

### 8.2 Page Details

#### Homepage (`/`)

- **SEO title:** "Claws.supply — OpenClaw Agent Templates Marketplace"
- **Content:**
  - Hero section: Tagline + CTA ("Browse Templates" / "Start Selling")
  - For each category: Section header + top 4-6 most popular templates (sorted by `download_count` DESC)
  - Categories stacked vertically, scrollable
  - Final CTA section
- **Data:** Server-side fetch. For each category, query top templates WHERE `is_flagged = false` ORDER BY `download_count DESC` LIMIT 6.

#### Category Page (`/openclaw/templates/[category]`)

- **SEO title:** "{Category Label} OpenClaw Templates — Claws.supply"
- **Meta description:** Dynamic, based on category description
- **Content:**
  - Category header with description
  - Grid of all templates in category (paginated, 20 per page)
  - Sort options: Newest, Most Popular, Price Low→High, Price High→Low
  - Filter: Free only toggle
- **Data:** Server-side with pagination. Validate `category` against `CATEGORIES` constant — 404 if invalid.

#### Template Detail (`/openclaw/template/[templateSlug]`)

- **SEO title:** "{Template Title} — OpenClaw Template on Claws.supply"
- **Content:**
  - Template title, description (rendered markdown), cover image
  - Price (or "Free"), Buy/Download button
  - Seller info card (avatar, name, verified badge, link to profile)
  - Stats: downloads, average rating, review count
  - Reviews section (paginated)
  - "Similar Templates" section: Query same category, exclude current, ORDER BY download_count DESC LIMIT 6
- **Referral tracking:** On page load, if `?ref=` param exists:
  - Validate it matches the seller's username
  - Store in cookie: `claws_ref_{templateSlug}={sellerUsername}` (90-day expiry)
  - At checkout, read cookie to determine sale type

#### Member Profile (`/members/[username]`)

- **SEO title:** "{Display Name} (@{username}) — Claws.supply"
- **Content:**
  - Avatar, display name, username, bio
  - Verified status badge (`VERIFIED` / `NOT VERIFIED`)
  - Verification checklist:
    - Verified twitter profile
    - Verified identity via Stripe
  - Grid of their published templates
- **Data:** Server-side. Query user by username, then their non-flagged templates.

#### Members Directory (`/members`)

- **SEO title:** "Community Members — Claws.supply"
- **Content:**
  - Community headline + total member count + join CTA
  - Search input (username/name)
  - Grid of members (paginated)
  - Each card: avatar (facehash fallback), name, username, bio preview, `VERIFIED` / `NOT VERIFIED`

#### Dashboard — My Purchases (`/dashboard`)

- **Auth required**
- List of purchased templates with re-download button
- If a newer version exists since purchase, show "New version available" badge
- Download calls the secure stream endpoint (`GET /api/templates/[slug]/download`) for the latest version

#### Dashboard — My Templates (`/dashboard/templates`)

- **Auth required, Seller only**
- List of seller's own templates with stats (downloads, revenue, rating)
- Edit / upload new version actions

#### CLI Publishing Guide (`/openclaw/templates/publish-via-cli`)

- Public guide page for sellers with exact CLI commands:
  - `npx claws-supply auth`
  - `npx claws-supply build`
  - `npx claws-supply publish`
- This replaces the previous web create-template form flow.

#### Dashboard — Settings (`/dashboard/settings`)

- **Auth required**
- Profile edit: display name, username, bio, avatar
- X Account: Connect / Disconnect
- Stripe: Connect / View status / Dashboard link
- Verification status display

### 8.3 SEO Strategy

- **All public pages are server-rendered** (RSC) for full SSR
- **Dynamic `<head>` metadata** on every page using Next.js `generateMetadata()`
- **Canonical URLs** on all pages
- **Open Graph + Twitter Card** meta tags on template and member pages
- **JSON-LD structured data:** `Product` schema on template pages, `Person` schema on member pages
- **Sitemap:** Auto-generated at `/sitemap.xml` — include all category pages, template pages, member pages
- **robots.txt:** Allow all public pages, disallow `/dashboard/*` and `/api/*`

---

## 9. Review System

### 9.1 Eligibility

A user can leave a review on a template if **at least one** of:

- They have a `purchase` record for that template (verified purchase → `is_verified_purchase = true`)
- They are a **verified user** (`isVerified === true`)

### 9.2 Constraints

- One review per user per template (enforced by unique index)
- Rating: 1-5 integer
- Title: optional, max 200 chars
- Body: optional, free text
- Reviews can be edited by the author, deleted by author or admin

### 9.3 Display

- Reviews show: author name, avatar, verified badge, rating, title, body, "Verified Purchase" badge if applicable, date
- Template detail page shows aggregate: average rating (1 decimal), total review count
- Sorted by newest first

---

## 10. Admin Functionality

For MVP, admin features are **API-only** (no admin UI). Admins use API calls or a simple script/tool.

### 10.1 Admin Capabilities

1. **Flag/unflag templates** — sets `is_flagged = true/false` with optional reason. Flagged templates are hidden from all public pages and search.
2. **Set commission overrides** — per-user custom direct/browsing rates.
3. **Delete reviews** — remove inappropriate reviews.
4. **Manage categories** — edit the `CATEGORIES` constant in code + deploy.

### 10.2 Admin Identification

- `users.role = 'admin'`
- Set manually in the database for MVP (no self-serve admin promotion)
- All admin API routes check `session.user.role === 'admin'`

---

## 11. Webhook Handlers

### Stripe Webhooks (`POST /api/stripe/webhooks`)

| Event                           | Action                                                                                       |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| `checkout.session.completed`    | Activate campaign after checkout and persist Stripe IDs + current billing period.            |
| `checkout.session.expired`      | Mark pending checkout campaign as canceled.                                                  |
| `customer.subscription.updated` | Sync subscription status/period/cancel flag; end campaign on final non-active Stripe states. |
| `customer.subscription.deleted` | End campaign and stop visibility.                                                            |
| `invoice.payment_failed`        | Record failure state for observability; do not hide ad immediately.                          |

All webhooks are verified via `stripe.webhooks.constructEvent()` with signing secret.
Webhook event IDs are persisted for idempotency in `stripe_webhook_event`.

---

## 12. Key Business Rules Summary

1. **Draft-first lifecycle:** templates are created as `draft` and only become public after explicit publish.
2. **Lifecycle states:** `draft`, `published`, `unpublished`, `deleted`; deleted templates cannot be edited/published/versioned.
3. **Owner/admin authorization:** users can mutate only their own templates; admins can mutate any template.
4. **Paid pricing gate:** `priceCents > 0` requires the template owner's Stripe account to be verified, even when mutation is triggered by admin.
5. **Slug constraints:** globally unique, URL-safe lowercase hyphenated, and immutable after creation.
6. **CLI-only creation:** new templates are created only via `/api/cli/v1/templates/publish`; `POST /api/templates` is removed.
7. **Web zip/version restrictions:** web zip/version endpoints return `410`; zip artifact upload/version publish happens via CLI flow.
8. **Description normalization:** markdown is allowed, but `#`/`##` headings are auto-demoted to `###` before persistence.
9. **Blob separation:** covers are public (`BLOB_READ_WRITE_TOKEN`), template zip artifacts are private (`PRIVATE_READ_WRITE_TOKEN`).
10. **CLI upload security:** zip token issuance is protected by bearer auth + rate limits, with deterministic `v1.zip` path, MIME, and max-size constraints.
11. **CLI signing verification:** finalize validates archive hash, manifest shape, publisher hash, and per-file hashes before DB insert.
12. **Download security:** all template downloads require authentication; access requires owner/admin, purchase, or free-template authenticated access.
13. **Versioning:** each version is immutable and unique per template; new version must increment by exactly `+1` (integer versioning).
14. **Download tracking:** `download_count` increments only after private blob fetch begins successfully.
15. **Soft delete:** deletion sets lifecycle status to `deleted`; data is retained.

### Known Hardening Gaps (Non-Blocking Follow-up)

- Webhook idempotency write timing should persist only after handler success to avoid skipping retriable failed events.
- Slot-cap enforcement has a potential race condition under high concurrency and should be made atomic.
- Ad destination URL validation should explicitly restrict to `http`/`https` protocols.
- Pending campaign reservation should be cleaned up if Stripe Checkout session creation fails after pending upsert.

---

## 13. Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Better Auth (already configured)
BETTER_AUTH_SECRET=...
CLI_DEVICE_CLIENT_IDS=claws-supply-cli

# X / Twitter OAuth
X_CLIENT_ID=...
X_CLIENT_SECRET=...
X_CALLBACK_URL=https://claws.supply/api/auth/x/callback

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_PLATFORM_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...
STRIPE_AD_PRICE_SIDEBAR_SANDBOX=price_...
STRIPE_AD_PRICE_RESULTS_SANDBOX=price_...
STRIPE_AD_PRICE_BOTH_SANDBOX=price_...
STRIPE_AD_PRICE_SIDEBAR_PRODUCTION=price_...
STRIPE_AD_PRICE_RESULTS_PRODUCTION=price_...
STRIPE_AD_PRICE_BOTH_PRODUCTION=price_...

# Vercel Blob storage
BLOB_READ_WRITE_TOKEN=...      # Public assets (covers/images)
PRIVATE_READ_WRITE_TOKEN=...   # Private template zips
# Optional when running upload callbacks in local/custom envs:
# VERCEL_BLOB_CALLBACK_URL=https://claws.supply

# App
NEXT_PUBLIC_APP_URL=https://claws.supply
```

---

## 14. Out of Scope (Post-MVP)

These are explicitly **not** in MVP but noted for future reference:

- Admin UI (admin panel with dashboards, charts)
- Nested categories / sub-categories
- Template preview (running a demo of the agent)
- Messaging between buyers and sellers
- Refund / dispute flow (handled by Stripe for now)
- Template analytics dashboard for sellers
- Wishlist / favorites
- Notification system (email, in-app)
- API rate limiting (beyond Stripe's built-in limits)
- Template search (full-text) — MVP uses category browse + sort only. Full-text search is v2.
