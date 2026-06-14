#!/usr/bin/env bash
set -e

# ── colours ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[dev]${NC} $*"; }
warn()  { echo -e "${YELLOW}[dev]${NC} $*"; }
error() { echo -e "${RED}[dev]${NC} $*"; exit 1; }

# ── 1. Docker ─────────────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || error "Docker not found. Install Docker Desktop first."

info "Starting PostgreSQL container..."
docker compose up -d

# ── 2. Wait for Postgres to be ready ─────────────────────────────────────────
info "Waiting for PostgreSQL to be ready..."
MAX=30; COUNT=0
until docker compose exec -T postgres pg_isready -U plotbazaar -d plotbazaar -q 2>/dev/null; do
  COUNT=$((COUNT + 1))
  [ $COUNT -ge $MAX ] && error "PostgreSQL did not become ready in time."
  echo -n "."
  sleep 1
done
echo ""
info "PostgreSQL is ready."

# ── 3. Prisma ─────────────────────────────────────────────────────────────────
info "Generating Prisma client..."
npx prisma generate

info "Pushing schema to database..."
npx prisma db push --skip-generate

# ── 4. Optional seed ──────────────────────────────────────────────────────────
if [ "$1" = "--seed" ]; then
  warn "Seeding database..."
  npm run db:seed
fi

# ── 5. Start dev server ───────────────────────────────────────────────────────
info "Starting Next.js dev server..."
npm run dev
