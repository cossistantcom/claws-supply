# claws-supply CLI (`packages/cli`)

MVP creator CLI for claws.supply with four commands:

- `claws-supply auth`
- `claws-supply logout`
- `claws-supply build`
- `claws-supply publish`

No consume/install flow is included in this phase.

## Commands

### `auth`

```bash
claws-supply auth [--client-id <id>] [-D] [--no-open] [--json]
```

What it does:

- Starts Better Auth device authorization via `/api/cli/v1/auth/device/code`
- Opens `verification_uri_complete` (unless `--no-open`)
- Polls `/api/cli/v1/auth/device/token` until approved
- Stores bearer auth state locally

Auth state path:

- `~/.config/claws-supply/auth.json` (or `$XDG_CONFIG_HOME/claws-supply/auth.json`)

### `logout`

```bash
claws-supply logout [--json]
```

What it does:

- Removes local CLI auth state file (`auth.json`) if present
- Succeeds even when no auth state file exists (idempotent)
- Does not revoke server-side session/token (local-only logout)

### `build`

```bash
claws-supply build [--source <path>] [--title <title>] [--slug <slug>] [--yes] [--include <glob>] [--exclude <glob>] [-D] [--json]
```

What it does:

- Requires existing auth state (for bearer token + publisher hash)
- Checks slug availability via `/api/cli/v1/templates/slug-availability`
- Scans source files and lets you choose include groups (interactive default)
- Builds deterministic zip with generated `manifest.json`
- Stores artifact metadata under project-local `.claws-supply`

Build artifact output:

- `./.claws-supply/builds/<slug>/v1/template-v1.zip`
- `./.claws-supply/builds/<slug>/v1/manifest.json`
- `./.claws-supply/builds/<slug>/v1/artifact.json`
- `./.claws-supply/latest-build.json`

Hard exclusions (always excluded):

- Memory: `memory/**`, `MEMORY.md`
- Secrets/state: `.env*`, `credentials/**`, `auth-profiles.json`, `sessions/**`, `logs/**`, sandbox/state files
- Generated/noisy dirs: `.git/**`, `node_modules/**`, `.next/**`, `.turbo/**`, `dist/**`

### `publish`

```bash
claws-supply publish [--artifact <zipPath>] [-D] [--json]
```

What it does:

- Loads latest build artifact (or `--artifact` path)
- Requests upload token via `/api/cli/v1/templates/uploads/zip-token`
- Uploads zip to deterministic private blob pathname with Vercel Blob client token
- Finalizes publish via `/api/cli/v1/templates/publish`
- Prints created draft template URL

Environment targeting:

- Default: production API (`https://claws.supply`)
- `-D`: local API (`http://localhost:3039`)

## Quick Start

```bash
cd /Users/anthonyriera/code/hourglass/packages/cli
bun run build
node dist/index.js auth -D
node dist/index.js build -D
node dist/index.js publish -D
```

## Local Testing Before Deploy

Automated:

```bash
cd /Users/anthonyriera/code/hourglass/packages/cli
bun run test
```

Manual smoke:

```bash
cd /Users/anthonyriera/code/hourglass/packages/cli
bun run smoke:local
```

Prerequisites:

- Run local web API at `http://localhost:3039`
- `apps/web/.env.local` includes `PRIVATE_READ_WRITE_TOKEN`
- Approve device code in browser during `auth`

## Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| `401 Unauthorized` | Expired/invalid token | Re-run `claws-supply auth` |
| `409 slug already in use` | Slug conflict | Pick another slug and rebuild |
| `422` publish validation error | Manifest/title/slug mismatch or artifact integrity issue | Re-run `build`, then `publish` |
| `429 Too many requests` | API rate limit | Wait and retry |
| Upload token errors | Missing web env config | Ensure `PRIVATE_READ_WRITE_TOKEN` is set for `apps/web` |

## Scripts

- `bun run build` — compile CLI with tsup
- `bun run test` — run vitest suite
- `bun run test:watch` — vitest watch mode
- `bun run smoke:local` — guided local smoke checklist
