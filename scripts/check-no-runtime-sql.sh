#!/usr/bin/env bash
set -euo pipefail

PATTERN='sql`|sql<|\bsql\('

if rg -n "$PATTERN" app lib --glob '!lib/db/schema.ts'; then
  echo
  echo "Runtime raw SQL usage detected. Use Drizzle query builder instead."
  exit 1
fi

echo "No runtime raw SQL usage found in app/ and lib/ (excluding lib/db/schema.ts)."
