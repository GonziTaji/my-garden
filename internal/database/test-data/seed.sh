#!/bin/bash
set -e

# DEV seeding

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
DB_PATH="$PROJECT_ROOT/internal/database/databases/main.db"

if [ ! -f "$DB_PATH" ]; then
  echo "Error: Database not found: $DB_PATH"
  exit 1
fi

echo "=== Cleaning database ==="
sqlite3 "$DB_PATH" "DELETE FROM plant_species_images WHERE plant_species_id IN (SELECT id FROM plant_species WHERE user_id = 1 AND deleted_at IS NULL);"
sqlite3 "$DB_PATH" "DELETE FROM plant_events WHERE user_id IN (SELECT id FROM users WHERE id NOT IN (SELECT DISTINCT user_id FROM plants WHERE user_id IS NOT NULL));"
sqlite3 "$DB_PATH" "DELETE FROM plants WHERE user_id = 1;"
sqlite3 "$DB_PATH" "DELETE FROM plant_species WHERE user_id = 1 AND deleted_at IS NULL;"
echo "Done: database cleaned"

echo ""
echo "=== Seeding admin user ==="
sqlite3 "$DB_PATH" < "$SCRIPT_DIR/users.sql"
echo "Done: admin user inserted"

echo ""
echo "=== Seeding plant species ==="
sqlite3 "$DB_PATH" < "$SCRIPT_DIR/plant-species-popular.sql"
echo "Done: plant species inserted"

echo ""
echo "=== Seeding plants ==="
sqlite3 "$DB_PATH" < "$SCRIPT_DIR/plants.sql"
echo "Done: plants inserted"

echo ""
echo "=== Seeding species images ==="
bash "$SCRIPT_DIR/seed-species-images.sh"
echo ""
echo "=== Seed complete ==="
