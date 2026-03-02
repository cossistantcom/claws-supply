# Claws.supply

Claws.supply is a marketplace for OpenClaw templates. Builders can discover production-ready agent setups faster, sellers can publish and monetize their templates, and buyers can purchase and deploy proven configurations. Template creation is CLI-first through the `claws-supply` package.

## What's In This Repo

- `apps/web` - Next.js App Router marketplace app and API (`@claws-supply/web`)
- `packages/cli` - `claws-supply` creator CLI for auth, build, and draft publish

## Tech Stack

- Monorepo/runtime: Bun (`>=1.3.1`) + Turborepo
- Web: Next.js App Router, React, Tailwind CSS
- Data/auth/payments/storage: Drizzle ORM + PostgreSQL, Better Auth, Stripe, Vercel Blob
- CLI: Node (`>=20`), Commander, Zod, fflate, Vercel Blob client

## Quickstart (Local Development)

Prerequisites:

- Bun `>=1.3.1`
- Node `>=20`
- Docker (for local Postgres)

1. Install dependencies.

```bash
bun install
```

2. Start local Postgres.

```bash
docker compose up -d
```

3. Create local env file and fill values.

```bash
cp apps/web/env.template apps/web/.env.local
```

4. Run database migrations.

```bash
bun run migrate
```

5. Start the app.

```bash
bun run dev
```

Web runs at `http://localhost:3039`.

## Common Monorepo Commands

| Command | Purpose |
| --- | --- |
| `bun run dev` | Run web app in development mode (`@claws-supply/web`) |
| `bun run build` | Build web app |
| `bun run start` | Start production server for web app |
| `bun run lint` | Run lint checks for web app |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run migrate` | Apply database migrations |
| `bun run check:no-runtime-sql` | Guardrail check for runtime SQL usage |

## CLI Quickstart (Creator Flow)

Run from your template project folder:

```bash
npx claws-supply@latest auth
npx claws-supply@latest build
npx claws-supply@latest publish
```

CLI defaults:

- Production API target is `https://claws.supply`
- Use `-D` to target local API: `http://localhost:3039`
- `build` uses the current directory by default (`--source` is optional)

For full CLI flags, local artifact/auth state paths, local smoke flows, and troubleshooting, see [`packages/cli/README.md`](packages/cli/README.md).

## Docs And Links

- Site: [https://claws.supply](https://claws.supply)
- Product docs: [https://claws.supply/docs](https://claws.supply/docs)
- CLI docs: [`packages/cli/README.md`](packages/cli/README.md)
- Internal product spec: [`MVP.md`](MVP.md)
- Internal CLI spec: [`CLI-spec.md`](CLI-spec.md)
