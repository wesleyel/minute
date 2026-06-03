#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="$ROOT/backups/$STAMP"
POSTGRES_URL="${POSTGRES_URL:-postgresql://postgres:postgres@localhost:5432/minute}"
SQLITE_PATH="${SQLITE_PATH:-$ROOT/packages/prisma/minute.db}"

mkdir -p "$BACKUP_DIR"

echo "Backing up PostgreSQL → $BACKUP_DIR/minute.postgres.sql"
docker exec minute-db-1 pg_dump -U postgres -d minute --no-owner --no-acl \
  >"$BACKUP_DIR/minute.postgres.sql"

if [[ -f "$SQLITE_PATH" ]]; then
  echo "Backing up SQLite → $BACKUP_DIR/minute.sqlite.before-migrate.db"
  cp "$SQLITE_PATH" "$BACKUP_DIR/minute.sqlite.before-migrate.db"
fi

echo "Migrating PostgreSQL data into SQLite..."
cd "$ROOT"
POSTGRES_URL="$POSTGRES_URL" SQLITE_PATH="$SQLITE_PATH" node scripts/migrate-postgres-to-sqlite.mjs

echo "Done. Backups: $BACKUP_DIR"
