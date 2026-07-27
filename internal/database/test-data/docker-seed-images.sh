#!/bin/sh
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

DB_PATH="${MY_GARDEN_DB:-/app/data/main.db}" \
UPLOADS_DIR="/app/public/uploads" \
IMAGES_DIR="/app/internal/database/test-data/plant-species-images" \
  exec bash "$SCRIPT_DIR/seed-species-images.sh"
