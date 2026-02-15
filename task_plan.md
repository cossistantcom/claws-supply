# Task Plan: Better Auth + Organization + Stripe Setup

## Goal
Set up Better Auth with Organization, Team, and Stripe plugins. Subscription is attached to the organization (not the user). Full onboarding flow: landing page CTA -> signup with email (auto-generated password) -> auto-create org + Stripe customer -> confirmation page -> plan selection via Stripe Checkout.

## Current State
- Better Auth configured with basic email/password (no plugins)
- Drizzle schema has manually created Stripe tables (wrong format for plugin)
- No organization/team tables
- No migrations run yet (fresh DB)
- Docker Compose Postgres ready on port 5499
- Stripe + @better-auth/stripe packages already installed

---

## Phase 1: Schema & Auth Configuration `status: pending`
**Files to modify:**
- `lib/db/schema.ts` - Replace manual Stripe tables + add org/team tables
- `lib/auth-server.ts` - Add organization + stripe plugins
- `lib/auth-client.ts` - Add organization + stripe client plugins
- `.env.local` - Add BETTER_AUTH_SECRET, STRIPE keys

**Tasks:**
1. Rewrite `lib/db/schema.ts` with all Better Auth plugin tables:
   - Core: user (+ stripeCustomerId), session (+ activeOrganizationId, activeTeamId), account, verification
   - Organization: organization (+ stripeCustomerId), member, invitation
   - Team: team, teamMember
   - Stripe: subscription (Better Auth format: plan, referenceId, stripeCustomerId, stripeSubscriptionId, status, periodStart/End, cancelAtPeriodEnd, cancelAt, canceledAt, endedAt, seats, trialStart/End)
2. Configure `lib/auth-server.ts` with organization + stripe plugins
3. Configure `lib/auth-client.ts` with organization + stripe client plugins
4. Update `.env.local` with BETTER_AUTH_SECRET + STRIPE keys

## Phase 2: Stripe Utility & Plans Config `status: pending`
**Files to create:**
- `lib/stripe.ts` - Stripe client instance + plans config

**Tasks:**
1. Create clean Stripe utility with:
   - Stripe client initialization
   - Plan definitions with env-based price IDs (dev vs prod)
   - Type-safe plan config exported for use in auth + UI
   - Three tiers: founding ($299), next ($449), final ($799)

## Phase 3: Database Migration `status: pending`
**Tasks:**
1. Start Postgres via Docker Compose
2. Generate Drizzle migration from updated schema
3. Run migration
4. Verify tables created correctly

## Phase 4: Onboarding API & Flow `status: pending`
**Files to create:**
- `app/api/onboard/route.ts` - Signup + org creation endpoint
- `app/(onboarding)/layout.tsx` - Onboarding layout
- `app/(onboarding)/welcome/page.tsx` - Confirmation / "what's next" page
- `app/(onboarding)/choose-plan/page.tsx` - Plan selection page

**Tasks:**
1. Create onboarding API route:
   - Accept email from form
   - Generate strong password
   - Sign up user via Better Auth API
   - Create org for user (named after email/name)
   - Stripe customer auto-created for org via plugin
   - Set active org on session
   - Return session for auto-login
2. Create welcome/confirmation page with premium "what's next"
3. Create plan selection page that triggers Stripe Checkout

## Phase 5: Landing Page Integration `status: pending`
**Tasks:**
1. Add email capture to CTA sections on landing page
2. Wire "APPLY FOR ACCESS" buttons to trigger onboarding
3. Handle redirect to /welcome after signup

---

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|

## Decisions
- Stripe customer attached to ORGANIZATION, not user
- Organization auto-created on signup
- Password auto-generated (email-only signup UX)
- Teams enabled for future use
- Three tiers: Founding $299, Next $449, Final $799
