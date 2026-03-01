# claws.supply

Bun + Turborepo monorepo.

## Workspace Layout

- `apps/web`: Next.js App Router application (`@claws-supply/web`)
- `packages/cli`: claws.supply creator CLI (`@claws-supply/cli`)

## Requirements

- Bun `1.3.1` or newer

## Install

```bash
bun install
```

## Root Commands

```bash
bun run dev
bun run build
bun run start
bun run lint
bun run check:no-runtime-sql
bun run db:generate
bun run migrate
```

## Environment Files

- Web app env file: `apps/web/.env.local`
- Template env values: `apps/web/env.template`

If you previously had `.env.local` at repo root, move it to `apps/web/.env.local`.
