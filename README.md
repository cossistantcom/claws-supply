# claws.supply

Bun + Turborepo monorepo.

Landing page: [claws.supply](https://claws.supply)

## Workspace Layout

- `apps/web`: Next.js App Router application (`@claws-supply/web`)
- `packages/cli`: claws.supply creator CLI (`claws-supply`)

## CLI Usage

Run without installing globally:

```bash
npx claws-supply auth
npx claws-supply build
npx claws-supply publish
```

`build` uses your current folder by default. Use `--source <path>` only when the target project is in a different folder.

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
