#!/usr/bin/env bash
# Clone Supabase production → dev (public schema only).
#
# Usage:
#   export PROD_DATABASE_URL='postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:5432/postgres'
#   export DEV_DATABASE_URL='postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:5432/postgres'
#   ./scripts/clone-prod-to-dev.sh
#
# Session pooler URI (port 5432). URL-encode special chars in password (@ → %40).

set -euo pipefail

PG_BIN="${PG_BIN:-/opt/homebrew/opt/libpq/bin}"
DUMP_FILE="${DUMP_FILE:-./autocast-prod-public.dump}"

if [[ ! -x "$PG_BIN/pg_dump" ]]; then
  echo "pg_dump not found. Install: brew install libpq"
  exit 1
fi

if [[ -z "${PROD_DATABASE_URL:-}" || -z "${DEV_DATABASE_URL:-}" ]]; then
  echo "Set PROD_DATABASE_URL and DEV_DATABASE_URL first."
  exit 1
fi

echo "→ Dumping production public schema (read-only)..."
"$PG_BIN/pg_dump" "$PROD_DATABASE_URL" \
  --schema=public \
  --format=custom \
  --no-owner \
  --no-acl \
  --file="$DUMP_FILE"

echo "→ Restoring into dev..."
set +e
"$PG_BIN/pg_restore" \
  --dbname="$DEV_DATABASE_URL" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  "$DUMP_FILE"
restore_status=$?
set -e

if [[ $restore_status -ne 0 ]]; then
  echo "⚠ pg_restore finished with warnings (code $restore_status). Checking data..."
fi

echo ""
echo "→ Row counts in DEV:"
"$PG_BIN/psql" "$DEV_DATABASE_URL" -At -c "
SELECT 'products=' || COUNT(*)::text FROM public.products
UNION ALL SELECT 'categories=' || COUNT(*)::text FROM public.categories
UNION ALL SELECT 'orders=' || COUNT(*)::text FROM public.orders
UNION ALL SELECT 'profiles=' || COUNT(*)::text FROM public.profiles;
" 2>/dev/null || echo "  (could not query — run migrations first or check connection)"

echo ""
echo "✓ Dump saved at: $DUMP_FILE"
echo "  Compare counts with prod in Supabase Table Editor."
echo "  Auth users are NOT cloned — register on localhost and grant admin in SQL Editor."
echo "  Restart: npm run dev"
