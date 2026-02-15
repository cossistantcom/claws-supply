# Findings

## Better Auth Stripe Plugin
- Adds `stripeCustomerId` field to `user` table (optional)
- Adds `stripeCustomerId` field to `organization` table when `organization.enabled: true`
- Creates `subscription` table with: id, plan, referenceId, stripeCustomerId, stripeSubscriptionId, status, periodStart/End, cancelAtPeriodEnd, cancelAt, canceledAt, endedAt, seats, trialStart/End
- `referenceId` = userId or orgId depending on `customerType`
- Webhook endpoint auto-handled at `/api/auth/stripe/webhook`
- `createCustomerOnSignUp: true` creates Stripe customer on user signup
- For org billing: `organization.enabled: true` in stripe plugin config
- Checkout: `authClient.subscription.upgrade({ plan, customerType: "organization", referenceId: orgId })`

## Better Auth Organization Plugin
- Creates: organization, member, invitation tables
- Adds `activeOrganizationId` to session table
- Teams (optional): team, teamMember tables + `activeTeamId` on session
- Default roles: owner, admin, member
- `creatorRole: "owner"` by default
- Lifecycle hooks: beforeCreateOrganization, afterCreateOrganization, etc.
- `organization()` imported from `better-auth/plugins`
- Client: `organizationClient()` from `better-auth/client/plugins`

## Current Schema Issues
- Manual `stripeCustomer` and `subscription` tables don't match Better Auth plugin format
- These need to be REPLACED entirely with the plugin's expected schema
- No org/team tables exist yet

## Key Architecture
- Subscription attached to organization (not user)
- On signup: create user -> create org -> Stripe customer auto-created for org
- Stripe plugin `organization.enabled: true` handles org-level billing
- `authorizeReference` callback controls who can manage org subscriptions

## Pricing Tiers (from landing page)
| Tier | Plan Name | Price | Spots |
|------|-----------|-------|-------|
| FOUNDING 50 | founding | $299/mo | 50 |
| NEXT 50 | next | $449/mo | 50 |
| FINAL 50 | final | $799/mo | 50 |
