# Task Plan: Railway Integration — Deploy Clawbot Per Subscriber

## Goal
Integrate Railway into the Hourglass dashboard so each paying subscriber can deploy their own clawbot instance with one click, track deployment progress in real-time, and get a success link when deployed.

## Current Phase
Phase 1

## Phases

### Phase 1: Database Schema & Migration
- [ ] Add `bot` table to `lib/db/schema.ts` (organizationId, railwayServiceId, railwayDeploymentId, status, serviceUrl, etc.)
- [ ] Generate Drizzle migration
- [ ] Run migration
- **Status:** pending

### Phase 2: Railway Server Module (`lib/railway/`)
- [ ] Create `lib/railway/client.ts` — GraphQL client wrapper (fetch-based, typed)
- [ ] Create `lib/railway/mutations.ts` — createService, setVariables, deploy, redeploy
- [ ] Create `lib/railway/queries.ts` — getDeployment, getService, getDeploymentStatus
- [ ] Create `lib/railway/types.ts` — TypeScript types for Railway API responses
- **Status:** pending

### Phase 3: API Routes
- [ ] `POST /api/bot/deploy` — Create Railway service + trigger deploy + insert bot record
- [ ] `GET /api/bot/status` — Return current bot status (polls Railway if deploying)
- [ ] Both routes: auth-protected, org-scoped, idempotent (prevent double deploys)
- **Status:** pending

### Phase 4: Install React Query & Wire Up Provider
- [ ] Install `@tanstack/react-query`
- [ ] Add `QueryClientProvider` to `app/providers.tsx`
- **Status:** pending

### Phase 5: Dashboard UI — Bot Deploy Panel
- [ ] Create `components/dashboard/bot-deploy-panel.tsx` — main panel component
- [ ] States: `idle` (no bot) → `deploying` (building/deploying) → `live` (success link) → `failed` (retry)
- [ ] Use React Query `useMutation` for deploy action
- [ ] Use React Query `useQuery` with polling for status tracking during deploy
- [ ] Display deployment URL on success
- **Status:** pending

### Phase 6: Integrate Into Dashboard Page
- [ ] Update `app/dashboard/page.tsx` to pass bot data to client
- [ ] Add `BotDeployPanel` alongside existing `BillingPanel`
- [ ] Server-side: load bot record for the org, pass initial state as props
- **Status:** pending

### Phase 7: Testing & Verification
- [ ] Verify TypeScript compiles (`bun run build`)
- [ ] Verify deploy flow end-to-end (manual test)
- [ ] Verify idempotency (can't double-deploy)
- [ ] Verify status polling works and stops on terminal state
- **Status:** pending

## Key Questions
1. What Docker image to deploy? → `ghcr.io/OWNER/clawbot:latest` (configurable via env var `RAILWAY_BOT_IMAGE`)
2. What env vars does clawbot need? → At minimum: `BOT_ID`, `ORG_ID` (extend later)
3. What Railway project ID to deploy into? → Env var `RAILWAY_PROJECT_ID`
4. What Railway environment ID? → Env var `RAILWAY_ENVIRONMENT_ID`

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Single `bot` table, one row per org | 1 sub = 1 bot; simple FK to organization |
| Stateless services (no volumes) | Avoids 20-volume quota limit on Railway Pro |
| Poll-based status tracking | Simpler than webhooks for MVP; React Query polling is trivial |
| Server-side Railway calls only | Token stays server-side; API routes proxy to Railway |
| Idempotent deploy endpoint | Prevents accidental double-deploys; returns existing bot if already deployed |
| React Query for data fetching | User requirement; clean cache/polling/mutation patterns |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
|       | 1       |            |

## Notes
- Railway env vars needed: `RAILWAY_API_TOKEN`, `RAILWAY_PROJECT_ID`, `RAILWAY_ENVIRONMENT_ID`, `RAILWAY_BOT_IMAGE`
- Bot status enum mirrors Railway's: `idle`, `building`, `deploying`, `success`, `failed`, `crashed`
- Deploy endpoint is the critical path: create service → set vars → trigger deploy → save to DB
