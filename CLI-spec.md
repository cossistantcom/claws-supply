# claws-supply CLI — MVP Technical Requirements

> **Purpose**: Spec for an AI coding agent to build the `claws-supply` NPX CLI.
> **Scope**: Dead-simple MVP for template creators. Authenticate, build/sign, and publish draft templates to claws.supply.
> **Philosophy**: If a non-technical user can't figure it out in 30 seconds, it's too complex.

---

## 1. What This CLI Does (and Doesn't Do)

**Does:**

- `npx claws-supply auth` — device authorization with browser approval and local token storage
- `npx claws-supply build` — build and sign a local template artifact (`manifest.json` + hashes)
- `npx claws-supply publish` — create a draft template for the authenticated user via `/api/cli/v1`

**Doesn't (not in MVP):**

- Download/install/use templates
- Patch OpenClaw config files
- Install plugins, hooks, or cron jobs
- Manage purchases
- Anything with `.clawpkg` archives — templates are plain zips hosted on claws.supply

The CLI is the **only supported template creation path** in MVP.

---

## 2. Tech Stack

```json
{
  "name": "claws-supply",
  "version": "0.1.0",
  "type": "module",
  "bin": { "claws-supply": "./dist/index.js" },
  "files": ["dist"],
  "engines": { "node": ">=20" },
  "dependencies": {
    "commander": "^14.0.0",
    "execa": "^9.6.0",
    "fs-extra": "^11.3.1",
    "kleur": "^4.1.5",
    "ora": "^8.2.0",
    "prompts": "^2.4.2",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "tsup": "^8.0.0",
    "@types/fs-extra": "^11.0.0",
    "@types/prompts": "^2.4.0",
    "vitest": "^3.0.0"
  }
}
```

| Library     | Why                                                        |
| ----------- | ---------------------------------------------------------- |
| `commander` | CLI args & flags                                           |
| `execa`     | Spawn `openclaw` commands for optional post-install checks |
| `fs-extra`  | File ops (ensureDir, copy, writeJson, readJson)            |
| `kleur`     | Colored terminal output                                    |
| `ora`       | Spinners for download / extract steps                      |
| `prompts`   | Interactive template picker + confirmations                |
| `zod`       | Validate API responses and manifest shape                  |

Build with `tsup`, output ESM, target Node 20, shebang included.

---

## 3. How Template Signing Works

This is the trust model. It's intentionally simple.

### 3.1 The Problem

A user downloads a zip from the internet. How do they know it actually came from the seller listed on claws.supply and wasn't tampered with?

### 3.2 The Solution: Publisher Email Hash

Every template on claws.supply carries a **publisher signature** — the SHA-256 hash of the seller's email address (lowercased, trimmed). This hash is:

1. **Computed server-side** when the seller publishes a template on claws.supply
2. **Stored in the database** on the `template` record
3. **Embedded inside the zip** as a `manifest.json` file at the root of the archive
4. **Returned by the API** when fetching template metadata

The CLI checks that the hash inside the zip matches the hash the API says it should be.

### 3.3 Signing Flow (Server-Side — claws.supply implements this)

When a seller clicks "Publish" on claws.supply:

```
1. Get seller's email from their auth session (Better Auth stores this)
2. Compute: publisherHash = sha256(email.toLowerCase().trim())
3. Generate manifest.json:
   {
     "id": "template-slug",
     "version": 3,
     "title": "Reddit Marketing Starter",
     "publisherHash": "a1b2c3d4...",     ← sha256 of seller email
     "publishedAt": "2026-02-28T...",
     "fileHashes": {
       "workspace/AGENTS.md": "sha256:...",
       "workspace/SOUL.md": "sha256:...",
       ...every file in the zip gets a hash
     }
   }
4. Inject manifest.json into the zip root before storing in Vercel Blob
5. Store publisherHash on the template DB record
6. Compute and store sha256 of the entire final zip as archiveHash
```

### 3.4 Verification Flow (CLI-Side — what we're building)

```
1. Fetch template metadata from API → includes publisherHash + archiveHash
2. Download the zip
3. Compute sha256 of downloaded zip → must match archiveHash from API
4. Extract manifest.json from zip
5. Verify manifest.json.publisherHash === API response publisherHash
6. For each file in manifest.json.fileHashes:
   → compute sha256 of extracted file
   → must match the hash in manifest
7. All checks pass → files are authentic and untampered
```

### 3.5 What This Protects Against

| Threat                                     | Protection                                                         |
| ------------------------------------------ | ------------------------------------------------------------------ |
| CDN/network tamper with zip                | archiveHash check catches it                                       |
| Someone repackages zip with modified files | Per-file hashes in manifest catch it                               |
| Someone forges a manifest.json             | publisherHash won't match API                                      |
| Seller A tries to impersonate Seller B     | publisherHash is derived from authenticated email, server-enforced |

### 3.6 What This Does NOT Protect Against

- claws.supply itself being compromised (out of scope for MVP)
- Seller publishing malicious content intentionally (moderation problem, not signing problem)

These are fine for MVP. The signing gives users a "this zip is exactly what the seller uploaded" guarantee.

---

## 4. Project Structure

```
claws-supply/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── src/
│   ├── index.ts              # Entry: shebang + bootstrap
│   ├── cli.ts                # Commander program definition
│   ├── commands/
│   │   ├── install.ts        # npx claws-supply <slug> (or interactive)
│   │   └── info.ts           # npx claws-supply info <slug>
│   ├── lib/
│   │   ├── api.ts            # Fetch from claws.supply API
│   │   ├── download.ts       # Download zip + verify archive hash
│   │   ├── verify.ts         # Extract manifest, check publisherHash + file hashes
│   │   ├── extract.ts        # Unzip verified files to target dir
│   │   └── constants.ts      # API base URL, user-agent, etc.
│   ├── schemas/
│   │   ├── api.ts            # Zod: API response shapes
│   │   └── manifest.ts       # Zod: manifest.json shape inside zip
│   └── utils/
│       ├── logger.ts         # kleur helpers
│       ├── spinner.ts        # ora wrapper
│       ├── hash.ts           # sha256 helper (node:crypto)
│       └── errors.ts         # Error classes + exit codes
└── tests/
    ├── verify.test.ts
    ├── manifest.test.ts
    └── fixtures/
        └── valid-template.zip
```

That's it. No config patching, no permission engine, no security scanner. Those are v2.

---

## 5. CLI Commands

### 5.1 Auth

```bash
npx claws-supply auth
```

- Starts device authorization via `/api/cli/v1/auth/device/code`
- Opens `verification_uri_complete` in browser
- Polls `/api/cli/v1/auth/device/token` until approved
- Stores bearer token + publisher hash locally

### 5.2 Build

```bash
npx claws-supply build
```

- Prompts for title + slug
- Verifies slug availability via `/api/cli/v1/templates/slug-availability`
- Builds zip and manifest with per-file hashes + publisher hash
- Produces signed archive metadata for publish step

### 5.3 Publish

```bash
npx claws-supply publish
```

- Requests zip upload token from `/api/cli/v1/templates/uploads/zip-token`
- Uploads deterministic private path `templates/private/zips/{userId}/{slug}/v1.zip`
- Finalizes draft creation via `/api/cli/v1/templates/publish`
- Prints the created template URL

---

## 6. Legacy Install Flow (Deferred)

This section is intentionally kept as a deferred reference for the future download/install phase. It is not part of the current creator-focused MVP.

```
STEP 1 — RESOLVE TEMPLATE
│
├── If slug provided as argument → use it
├── If no argument → interactive mode:
│   ├── Fetch GET /api/templates?sort=popular&limit=20
│   ├── Show autocomplete list with prompts
│   └── User picks one → got the slug
│
│
STEP 2 — FETCH METADATA
│
├── GET /api/templates/{slug}
├── Validate response with Zod
├── Extract: title, version, description, author, priceCents,
│            publisherHash, archiveHash, downloadUrl/slug
├── If priceCents > 0:
│   └── Print: "This is a paid template (${price}). Purchase it at
│              https://claws.supply/openclaw/template/{slug}"
│              then exit code 3. (CLI does not handle payments.)
│
│
STEP 3 — SHOW SUMMARY + CONFIRM
│
├── Print template card:
│   ┌──────────────────────────────────────────────┐
│   │  🐾 reddit-marketing-starter v3              │
│   │  by @johndoe (verified ✓)                    │
│   │                                              │
│   │  Reddit marketing agent with scheduling,     │
│   │  post templates, and karma tracking.         │
│   │                                              │
│   │  Category: Marketing                         │
│   │  Downloads: 1,284                            │
│   │  Rating: 4.7 ★ (23 reviews)                  │
│   │  Publisher: a1b2c3d4...ef (verified)         │
│   └──────────────────────────────────────────────┘
│
├── Print: "Will install to: ./reddit-marketing-starter"
│
├── If --yes flag → skip
├── Otherwise → prompts confirm: "Install this template? (y/n)"
├── If no → exit 0
│
│
STEP 4 — DOWNLOAD
│
├── Start ora spinner: "Downloading template..."
├── GET /api/templates/{slug}/download
│   (free templates: no auth needed;
│    for MVP CLI we only support free templates)
├── Save to OS temp dir as {slug}-v{version}.zip
├── Spinner succeed: "Downloaded (1.2 MB)"
│
│
STEP 5 — VERIFY INTEGRITY
│
├── Start spinner: "Verifying template..."
│
├── 5a. Archive hash
│   ├── Compute sha256 of the downloaded zip
│   ├── Compare to archiveHash from API
│   └── MISMATCH → abort, exit 2:
│       "✗ Archive hash mismatch. The download may be corrupted
│        or tampered with. Try again or report at claws.supply."
│
├── 5b. Extract manifest.json from zip (don't extract other files yet)
│   ├── Parse JSON
│   ├── Validate with Zod ManifestSchema
│   └── INVALID → abort, exit 1:
│       "✗ Invalid manifest. This template may be malformed."
│
├── 5c. Publisher hash
│   ├── Compare manifest.publisherHash to API publisherHash
│   └── MISMATCH → abort, exit 2:
│       "✗ Publisher mismatch. The template's claimed publisher
│        doesn't match claws.supply records."
│
├── 5d. File hashes
│   ├── For each entry in manifest.fileHashes:
│   │   ├── Extract that single file from zip
│   │   ├── Compute sha256
│   │   └── Compare to manifest value
│   └── ANY MISMATCH → abort, exit 2:
│       "✗ File integrity check failed for: {filename}
│        The template contents may have been tampered with."
│
├── Spinner succeed: "Verified ✓ (publisher + 12 files)"
│
│
STEP 6 — EXTRACT
│
├── Start spinner: "Installing template..."
├── Create target directory (--dir or ./{slug})
├── Extract ALL files from zip EXCEPT manifest.json
│   into the target directory, preserving structure
├── Write .claws-lock.json into target dir (see 6.1)
├── Spinner succeed: "Installed to ./reddit-marketing-starter"
│
│
STEP 7 — DONE
│
└── Print:
    ✅ Template installed!

    📂 ./reddit-marketing-starter
    🐾 reddit-marketing-starter v3 by @johndoe

    Files:
      AGENTS.md
      SOUL.md
      TOOLS.md
      USER.md
      skills/reddit-poster/skill.md

    Next steps:
      cd reddit-marketing-starter
      openclaw
```

### 6.1 Lock File

Write `.claws-lock.json` in the target directory after successful install:

```json
{
  "templateSlug": "reddit-marketing-starter",
  "version": 3,
  "installedAt": "2026-02-28T14:30:00Z",
  "source": "https://claws.supply",
  "publisherHash": "a1b2c3d4...ef",
  "archiveHash": "f0e1d2c3...ab",
  "files": [
    "AGENTS.md",
    "SOUL.md",
    "TOOLS.md",
    "USER.md",
    "skills/reddit-poster/skill.md"
  ]
}
```

This exists so a future `claws-supply upgrade` command can know what's installed. For MVP, it's just written — not read.

### 6.2 Dry-Run Mode

When `--dry-run` is passed, execute Steps 1–5 (resolve, fetch, confirm, download, verify) then instead of extracting, print:

```
DRY RUN — no files written.

Would create: ./reddit-marketing-starter/
Would extract 5 files:
  AGENTS.md (1.2 KB)
  SOUL.md (856 B)
  TOOLS.md (2.1 KB)
  USER.md (432 B)
  skills/reddit-poster/skill.md (1.8 KB)

Template is verified ✓
```

Then exit 0.

---

## 7. claws.supply API Integration

The CLI talks to the **existing** claws.supply API. Here's exactly what it needs.

### 7.1 Base URL

```typescript
const API_BASE = "https://claws.supply";
```

### 7.2 Endpoints Used by CLI

| What | Method | Endpoint | Auth | Notes |
| ---- | ------ | -------- | ---- | ----- |
| Start device auth | `POST` | `/api/cli/v1/auth/device/code` | No | Returns `device_code`, `user_code`, `verification_uri`, `interval`, `expires_in`. |
| Poll device token | `POST` | `/api/cli/v1/auth/device/token` | No | Returns bearer token payload + `publisherHash` on success. |
| Check slug | `GET` | `/api/cli/v1/templates/slug-availability?slug={slug}` | Bearer | Used by `build` to pre-check uniqueness (non-reserving). |
| Zip upload token | `POST` | `/api/cli/v1/templates/uploads/zip-token` | Bearer | Returns constrained private Blob client token for deterministic `v1.zip` upload. |
| Finalize publish | `POST` | `/api/cli/v1/templates/publish` | Bearer | Verifies signed archive and creates draft template. Returns draft + template URL. |

### 7.3 API Response Shapes (Zod)

These must match the **actual** API responses from the claws.supply codebase.

```typescript
// src/schemas/api.ts
import { z } from "zod";

// GET /api/templates — list item
export const TemplateListItemSchema = z.object({
  slug: z.string(),
  title: z.string(),
  shortDescription: z.string().nullable(),
  category: z.string(),
  priceCents: z.number(),
  coverUrl: z.string().nullable(),
  downloadCount: z.number(),
  version: z.number(),
  seller: z.object({
    username: z.string(),
    name: z.string().nullable(),
    isVerified: z.boolean(),
  }),
});

export const TemplateListResponseSchema = z.object({
  data: z.array(TemplateListItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

// GET /api/templates/{slug} — full detail
export const TemplateDetailSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  shortDescription: z.string().nullable(),
  category: z.string(),
  priceCents: z.number(),
  coverUrl: z.string().nullable(),
  downloadCount: z.number(),
  version: z.number(),
  versionNotes: z.string().nullable(),
  publishedAt: z.string().nullable(),
  publisherHash: z.string(),
  archiveHash: z.string(),
  seller: z.object({
    username: z.string(),
    name: z.string().nullable(),
    isVerified: z.boolean(),
    avatarUrl: z.string().nullable(),
  }),
  stats: z
    .object({
      averageRating: z.number().nullable(),
      reviewCount: z.number(),
    })
    .optional(),
});

export const TemplateDetailResponseSchema = z.object({
  data: TemplateDetailSchema,
});
```

### 7.4 HTTP Client Rules

- Use **native `fetch()`** — no axios, no got, no undici
- Set `User-Agent: claws-supply/{version}` on all requests
- Timeouts: 15s for metadata, 120s for downloads
- On network error: retry once, then print clear error with URL
- Validate every response through Zod **before** using any data
- Follow the existing API envelope: `{ data: ... }` on success, `{ error: { code, message } }` on failure

---

## 8. manifest.json Schema (Inside the Zip)

This is what claws.supply injects into every template zip at publish time.

```typescript
// src/schemas/manifest.ts
import { z } from "zod";

export const ManifestSchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  title: z.string(),
  publisherHash: z.string().regex(/^[a-f0-9]{64}$/),
  publishedAt: z.string().datetime(),
  fileHashes: z.record(z.string(), z.string().regex(/^sha256:[a-f0-9]{64}$/)),
});

export type Manifest = z.infer<typeof ManifestSchema>;
```

Example `manifest.json`:

```json
{
  "id": "reddit-marketing-starter",
  "version": 3,
  "title": "Reddit Marketing Starter",
  "publisherHash": "a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd",
  "publishedAt": "2026-02-28T14:00:00Z",
  "fileHashes": {
    "AGENTS.md": "sha256:1a2b3c4d5e6f708090a0b0c0d0e0f0001122334455667788990011223344aabb",
    "SOUL.md": "sha256:2b3c4d5e6f708090a0b0c0d0e0f0001122334455667788990011223344aabb",
    "TOOLS.md": "sha256:3c4d5e6f708090a0b0c0d0e0f0001122334455667788990011223344aabbcc",
    "USER.md": "sha256:4d5e6f708090a0b0c0d0e0f0001122334455667788990011223344aabbccdd",
    "skills/reddit-poster/skill.md": "sha256:5e6f708090a0b0c0d0e0f0001122334455667788990011223344aabbccddee"
  }
}
```

The manifest is **not** included when files are extracted to the user's directory. It's only used for verification.

---

## 9. Server-Side Changes Required on claws.supply

The CLI depends on claws.supply doing these things. Build them alongside the CLI.

### 9.1 New DB Columns on `template` Table

Add two columns:

```sql
ALTER TABLE template ADD COLUMN publisher_hash VARCHAR(64);
ALTER TABLE template ADD COLUMN archive_hash VARCHAR(64);
```

Both are populated at publish time. Both are nullable (existing templates won't have them until re-published).

### 9.2 Inject manifest.json at Publish Time

**Where**: Template publish flow (`POST /api/templates/[slug]/publish` and `POST /api/templates/[slug]/versions/publish`)

**What**: After the seller uploads their zip but before it's stored in Vercel Blob:

```
1. Read seller email from session (Better Auth → user.email)
2. publisherHash = sha256(email.toLowerCase().trim())
3. Read the uploaded zip from Vercel Blob (it's already uploaded via client upload)
4. Walk all files in the zip, compute sha256 for each
5. Build manifest.json:
   {
     id: template.slug,
     version: template.version,
     title: template.title,
     publisherHash,
     publishedAt: new Date().toISOString(),
     fileHashes: { "relative/path": "sha256:hexdigest", ... }
   }
6. Create a new zip = original zip + manifest.json at root
7. archiveHash = sha256(new zip buffer)
8. Overwrite the Vercel Blob object with the new zip
   (or upload as new path — the pathname is deterministic per version)
9. Update template record: SET publisher_hash, archive_hash
```

### 9.3 Expose publisherHash + archiveHash in GET API

**Where**: `GET /api/templates/[slug]` response

**What**: Add two fields to the detail response object:

```typescript
{
  // ...existing fields...
  publisherHash: template.publisherHash,  // sha256 of seller email, or null
  archiveHash: template.archiveHash,      // sha256 of the zip, or null
}
```

These are public. The email itself is never exposed — only its hash.

### 9.4 Allow Unauthenticated Download for Free Templates

**Where**: `GET /api/templates/[slug]/download`

**Current behavior**: Requires authentication for all downloads.

**Needed for CLI MVP**: Free templates (`priceCents === 0`) should be downloadable without auth. The CLI doesn't handle login flows.

If this change is blocked, the fallback is: CLI prints a link and tells the user to download manually from the browser. But unauthenticated free downloads is the better UX.

---

## 10. Terminal UX

### 10.1 Colors (kleur)

```typescript
import kleur from "kleur";

export const ui = {
  brand: (s: string) => kleur.magenta().bold(s),
  success: (s: string) => kleur.green(s),
  warn: (s: string) => kleur.yellow(s),
  error: (s: string) => kleur.red().bold(s),
  info: (s: string) => kleur.cyan(s),
  dim: (s: string) => kleur.dim(s),
  bold: (s: string) => kleur.bold(s),
};
```

### 10.2 Branded Header

Show at CLI start (interactive mode only, skip if `--json`):

```
  claws.supply
  OpenClaw Template Installer
```

Use `ui.brand` for "claws.supply" and `ui.dim` for the subtitle. Two lines, compact.

### 10.3 Spinners (ora)

Use for any step > 300ms:

```typescript
const spinner = ora({ text: "Downloading...", spinner: "dots" }).start();
spinner.succeed("Downloaded (1.2 MB)");
spinner.fail("Download failed: connection timeout");
```

### 10.4 Interactive Prompts (prompts)

Template picker:

```typescript
const { slug } = await prompts({
  type: "autocomplete",
  name: "slug",
  message: "Search templates",
  choices: templates.map((t) => ({
    title: `${t.title} ${kleur.dim(`v${t.version} · ${t.category}`)}`,
    description: t.shortDescription ?? "",
    value: t.slug,
  })),
  suggest: (input, choices) =>
    choices.filter((c) => c.title.toLowerCase().includes(input.toLowerCase())),
});
```

Confirmation:

```typescript
const { confirmed } = await prompts({
  type: "confirm",
  name: "confirmed",
  message: "Install this template?",
  initial: true,
});
```

### 10.5 Non-TTY / CI Mode

When stdout is not a TTY or `--json` is passed:

- No spinners, no colors, no prompts
- Output one JSON object to stdout at the end
- Require `--yes` to skip prompts (or exit 4)
- Errors go to stderr

```json
{
  "success": true,
  "template": "reddit-marketing-starter",
  "version": 3,
  "directory": "./reddit-marketing-starter",
  "files": ["AGENTS.md", "SOUL.md", "TOOLS.md", "USER.md"],
  "verified": true
}
```

---

## 11. Error Handling

### Exit Codes

| Code | Meaning                                                         |
| ---- | --------------------------------------------------------------- |
| `0`  | Success or user cancelled                                       |
| `1`  | Invalid manifest / schema error                                 |
| `2`  | Integrity failure (hash mismatch — archive, publisher, or file) |
| `3`  | Paid template (CLI can't handle payment)                        |
| `4`  | Non-interactive terminal without `--yes`                        |
| `5`  | Network / API error                                             |
| `7`  | File system error                                               |
| `99` | Unknown error                                                   |

### Error Format

Always:

1. Red `✗` with one-line summary
2. Dim suggestion line

```
✗ Archive hash mismatch
  The download may be corrupted. Try again, or download from claws.supply directly.

✗ Template "nonexistent-slug" not found
  Check the slug at https://claws.supply or run `npx claws-supply` to browse.

✗ This is a paid template ($12.00)
  Purchase it at: https://claws.supply/openclaw/template/reddit-marketing-starter
```

---

## 12. Build Config

### tsup.config.ts

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  clean: true,
  dts: true,
  banner: { js: "#!/usr/bin/env node" },
  splitting: false,
  sourcemap: true,
});
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 13. Tests

Use vitest. Focus on the trust layer:

| Test file          | What to test                                                                       |
| ------------------ | ---------------------------------------------------------------------------------- |
| `verify.test.ts`   | Archive hash passes/fails, publisher hash match/mismatch, file hash match/mismatch |
| `manifest.test.ts` | Zod accepts valid manifests, rejects missing fields, rejects bad hash format       |
| `api.test.ts`      | Zod validates real-shaped API responses, rejects garbage                           |
| `extract.test.ts`  | Files land in correct dir, manifest.json excluded, structure preserved             |

Create `tests/fixtures/` with a small valid zip for integration tests.

---

## 14. Build Order

Implement in this sequence:

1. **Scaffold** — package.json, tsconfig, tsup, directory structure
2. **Zod schemas** — CLI auth + build/publish payload schemas
3. **Hash utility** — `sha256File()` and `sha256String()` using `node:crypto`
4. **Auth client** — device-code start + token polling flow
5. **Build** — package local workspace zip + inject `manifest.json`
6. **Upload** — request zip upload token and upload deterministic `v1.zip`
7. **Publish finalize** — call `/api/cli/v1/templates/publish` and print resulting template URL
8. **CLI wiring** — commander setup, `auth` + `build` + `publish` commands
9. **UX polish** — header, spinners, colors, prompts, error formatting
10. **Tests** — unit tests for auth polling, manifest generation, and publish finalize integration

---

## 15. NOT in MVP

Explicitly deferred:

- Template download/install/use flows
- Config patching (no `~/.openclaw/openclaw.json` writes)
- Dependency installation (no plugin/skill installs)
- Cron job handling
- Security scanning of workspace content
- Upgrade command (lock file written but never read)
- Export command beyond `build`/`publish` happy path
- Paid template purchase flow
