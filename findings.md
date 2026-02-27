# Findings & Decisions

## Requirements

- Each paying subscriber gets ONE bot deployed via Railway
- One-click deploy from the dashboard after onboarding completes
- Real-time deployment status tracking (building → deploying → success/failed)
- Success state with a link to the deployed bot
- Clean API layer using React Query for client-server communication
- Deploy a custom Docker image (`clawbot`) per subscriber
- Per-bot environment variables (bot ID, customer config)

## Research Findings

### Codebase Architecture
- **Framework**: Next.js 16.1.6, React 19, TypeScript, Bun
- **Auth**: Better-Auth 1.4.18 with org + Stripe plugins
- **DB**: PostgreSQL via Drizzle ORM (schema at `lib/db/schema.ts`)
- **Payments**: Stripe with 3-tier pricing (founding/next/final)
- **State management**: `nuqs` for URL state, no React Query yet (needs install)
- **Providers**: Only `NuqsAdapter` in `app/providers.tsx`
- **Dashboard**: `app/dashboard/page.tsx` — protected route, shows billing panel only
- **DB connection**: `lib/db/index.ts` — Drizzle with pg, env-based config

### Railway API Surface (GraphQL)
- **Endpoint**: `POST https://backboard.railway.com/graphql/v2`
- **Auth**: `Authorization: Bearer <TOKEN>` (workspace token)
- **Rate limits (Pro)**: 10,000 req/hour, 50 rps

#### Key Mutations We Need
1. `serviceCreate(input: ServiceCreateInput!)` — create service from Docker image
   - Fields: `projectId`, `name`, `source` (image), `variables`
   - Returns: `id`, `name`
2. `variableCollectionUpsert(input: VariableCollectionUpsertInput!)` — bulk set env vars
   - Fields: `projectId`, `environmentId`, `serviceId`, `variables`, `replace`, `skipDeploys`
3. `serviceInstanceUpdate(serviceId, environmentId, input)` — update image tag, config
4. `serviceInstanceDeployV2(serviceId, environmentId)` — trigger deploy, returns deployment ID
5. `serviceInstanceRedeploy(serviceId, environmentId)` — redeploy existing

#### Key Queries We Need
1. `deployment(id: String!)` — get deployment status
   - Returns: `id`, `status`, `createdAt`, `url`, `staticUrl`
2. `deployments(input: DeploymentListInput!)` — list deployments with status filter
3. `service(id: String!)` — get service details
4. `serviceInstance(serviceId, environmentId)` — get instance with latest deployment

#### Deployment Status Enum
`BUILDING`, `DEPLOYING`, `SUCCESS`, `FAILED`, `CRASHED`, `REMOVED`, `SLEEPING`, `SKIPPED`, `WAITING`, `QUEUED`

### Architecture Decision: No Volumes
Per research, 100-150 bots would exceed Railway's 20-volume/project Pro limit. Since clawbot state is lightweight (config/markdown), we'll use **stateless services** with config passed via environment variables. No volumes needed for MVP.

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| No volumes per bot | 20-volume Pro limit; bot config via env vars is simpler |
| Single Railway project, one service per bot | Clean mapping, stays within service limits |
| Workspace token (not project token) | Need to create services programmatically |
| React Query (`@tanstack/react-query`) | User requested; industry standard for server state |
| Poll deployment status (not webhooks) | Simpler for MVP; webhook adds infra complexity |
| `lib/railway/` module for all Railway logic | Clean separation, server-only code |
| New `bot` table in DB | Track Railway service/deployment IDs per organization |
| GHCR for Docker image | Railway auto-updates supported for GHCR |

## Resources

- Railway GraphQL API: https://backboard.railway.com/graphql/v2
- Railway API docs: https://docs.railway.com/integrations/api
- Railway GraphiQL playground: https://railway.com/graphiql
- Railway manage services: https://docs.railway.com/integrations/api/manage-services
- Railway manage deployments: https://docs.railway.com/integrations/api/manage-deployments
