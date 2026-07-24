#!/bin/sh
set -e

DB_PATH="${MY_GARDEN_DB:-/app/data/main.db}"
SEED_DIR="/app/internal/database/test-data"

# Auto-seed if the database has no plant species (first run)
species_count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM plant_species WHERE deleted_at IS NULL;" 2>/dev/null || echo "0")

if [ "$species_count" -eq 0 ] && [ -d "$SEED_DIR" ]; then
  echo "=== Empty database detected, seeding ==="

  echo "Seeding plant species..."
  sqlite3 "$DB_PATH" < "$SEED_DIR/plant-species-popular.sql"
  echo "Done: plant species inserted"

  echo "Seeding species images..."
  if [ -x "$SEED_DIR/docker-seed-images.sh" ]; then
    bash "$SEED_DIR/docker-seed-images.sh"
  else
    echo "Skipped: image seed script not found"
  fi

  echo "=== Seed complete ==="
fi

exec "$@"
