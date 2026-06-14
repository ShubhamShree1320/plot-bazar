#!/usr/bin/env bash
set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[dev]${NC} $*"; }
warn()  { echo -e "${YELLOW}[dev]${NC} $*"; }
error() { echo -e "${RED}[dev]${NC} $*"; exit 1; }

# ── 0. Validate .env ─────────────────────────────────────────────────────────
[ -f ".env" ] || error ".env file not found. Create one — see .env.example."

DB_URL=$(grep -E '^DATABASE_URL=' .env | head -1 | sed 's/DATABASE_URL=//;s/^"//;s/"$//')

[ -z "$DB_URL" ] && error "DATABASE_URL is not set in .env"

if echo "$DB_URL" | grep -q "^prisma+postgres://"; then
  error "DATABASE_URL is still the prisma+postgres:// format.\nUpdate .env with a standard PostgreSQL URL:\n  DATABASE_URL=\"postgresql://plotbazaar:plotbazaar@localhost:5432/plotbazaar\""
fi

info "DATABASE_URL looks good."

# ── 1. Dependencies ───────────────────────────────────────────────────────────
if [ ! -d "node_modules" ]; then
  info "node_modules not found — running npm install..."
  npm install
else
  info "Dependencies already installed."
fi

# ── 2. Docker + PostgreSQL ────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || error "Docker not found. Install Docker first."

info "Starting PostgreSQL container..."
docker compose up -d

info "Waiting for PostgreSQL to be ready..."
MAX=30; COUNT=0
until docker compose exec -T postgres pg_isready -U plotbazaar -d plotbazaar -q 2>/dev/null; do
  COUNT=$((COUNT + 1))
  [ $COUNT -ge $MAX ] && error "PostgreSQL did not become ready in time."
  printf "."
  sleep 1
done
echo ""
info "PostgreSQL is ready."

# ── 3. Prisma ─────────────────────────────────────────────────────────────────
info "Generating Prisma client..."
npx prisma generate

info "Pushing schema to database..."
npx prisma db push

# ── 4. Optional seed ──────────────────────────────────────────────────────────
if [ "$1" = "--seed" ]; then
  warn "Seeding database with sample data..."
  npm run db:seed
fi

# ── 5. Start dev server ───────────────────────────────────────────────────────
info "Starting Next.js dev server at http://localhost:3000"
npm run dev
