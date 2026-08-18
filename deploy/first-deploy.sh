#!/bin/sh
set -eu

BACKUP_FILE=${1:-gard018-production.dump}

if [ ! -f .env ]; then
  echo "Nedostaje .env u direktorijumu projekta."
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Nedostaje backup: $BACKUP_FILE"
  exit 1
fi

set -a
. ./.env
set +a

docker compose up -d postgres

echo "Čekam PostgreSQL..."
until docker compose exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; do
  sleep 2
done

TABLE_COUNT=$(docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'" | tr -d '\r')
if [ "$TABLE_COUNT" != "0" ]; then
  echo "Baza nije prazna ($TABLE_COUNT tabela). Restore je prekinut da ne bi obrisao podatke."
  exit 1
fi

docker compose cp "$BACKUP_FILE" postgres:/tmp/gard018-production.dump
docker compose exec -T postgres pg_restore --no-owner --no-acl -U "$POSTGRES_USER" -d "$POSTGRES_DB" /tmp/gard018-production.dump

docker compose up -d --remove-orphans
docker compose ps

echo "Prvo podizanje je završeno. Proveri: https://app.gard018.com/api/health"

