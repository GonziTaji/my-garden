#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

DB_PATH="${DB_PATH:-$PROJECT_ROOT/internal/database/databases/main.db}"
UPLOADS_DIR="${UPLOADS_DIR:-$PROJECT_ROOT/public/uploads}"
IMAGES_DIR="${IMAGES_DIR:-$SCRIPT_DIR/plant-species-images}"

if [ ! -d "$IMAGES_DIR" ]; then
  echo "Error: Images directory not found: $IMAGES_DIR"
  exit 1
fi

if [ ! -f "$DB_PATH" ]; then
  echo "Error: Database not found: $DB_PATH"
  exit 1
fi

mkdir -p "$UPLOADS_DIR"

generate_uuid() {
  if [ -f /proc/sys/kernel/random/uuid ]; then
    cat /proc/sys/kernel/random/uuid
  elif command -v uuidgen >/dev/null 2>&1; then
    uuidgen | tr '[:upper:]' '[:lower:]'
  elif command -v python3 >/dev/null 2>&1; then
    python3 -c "import uuid; print(uuid.uuid4())"
  else
    echo "Error: No UUID generator available (need uuidgen, python3, or /proc/sys/kernel/random/uuid)" >&2
    exit 1
  fi
}

declare -A SPECIES_MAP
SPECIES_MAP=(
  ["aglaomena.webp"]="Aglaonema commutatum"
  ["alocacia_polly.webp"]="Alocasia amazonica"
  ["aloe-vera.jpg"]="Aloe vera"
  ["beaucarnea-recurvata.webp"]="Beaucarnea recurvata"
  ["calathea-orbifolia.webp"]="Calathea orbifolia"
  ["ceropegia-woodii.webp"]="Ceropegia woodii"
  ["chamaedorea-elegans.webp"]="Chamaedorea elegans"
  ["chlorophytum-comosum.webp"]="Chlorophytum comosum"
  ["codiaeum-variegatum.webp"]="Codiaeum variegatum"
  ["dieffenbachia-seguine.webp"]="Dieffenbachia seguine"
  ["dracaena-marginata.webp"]="Dracaena marginata"
  ["dracaena-trifasciata.webp"]="Dracaena trifasciata"
  ["echeveria-elegans.webp"]="Echeveria elegans"
  ["epipremnum-aureum.webp"]="Epipremnum aureum"
  ["ficus-elastica.webp"]="Ficus elastica"
  ["ficus-lyrata.webp"]="Ficus lyrata"
  ["fittonia-albivenis.webp"]="Fittonia albivenis"
  ["haworthiopsis-fasciata.webp"]="Haworthiopsis fasciata"
  ["maranta-leuconeura.webp"]="Maranta leuconeura"
  ["monkey-mask.webp"]="Monstera adansonii"
  ["monstera-deliciosa.webp"]="Monstera deliciosa"
  ["nephrolepis-exaltata.webp"]="Nephrolepis exaltata"
  ["peperomia-obtusifolia.webp"]="Peperomia obtusifolia"
  ["philodendron-hederaceum.webp"]="Philodendron hederaceum"
  ["pilea-peperomioides.webp"]="Pilea peperomioides"
  ["sedum-morganianum.webp"]="Sedum morganianum"
  ["senecio-radicans.webp"]="Senecio radicans"
  ["spathiphyllum-wallisii.webp"]="Spathiphyllum wallisii"
  ["strelitzia-reginae.webp"]="Strelitzia reginae"
  ["tradescantia-zebrina.webp"]="Tradescantia zebrina"
  ["zamioculcas-zamiifolia.webp"]="Zamioculcas zamiifolia"
)

inserted=0
skipped=0

for image_file in "$IMAGES_DIR"/*.webp "$IMAGES_DIR"/*.jpg; do
  [ -f "$image_file" ] || continue

  filename=$(basename "$image_file")
  species_name="${SPECIES_MAP[$filename]}"

  if [ -z "$species_name" ]; then
    echo "SKIP: No species mapping for $filename"
    skipped=$((skipped + 1))
    continue
  fi

  species_id=$(sqlite3 "$DB_PATH" "SELECT id FROM plant_species WHERE scientific_name = '$species_name' AND deleted_at IS NULL LIMIT 1;")

  if [ -z "$species_id" ]; then
    echo "SKIP: Species not found in DB: $species_name (from $filename)"
    skipped=$((skipped + 1))
    continue
  fi

  existing=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM plant_species_images WHERE plant_species_id = $species_id;")

  if [ "$existing" -gt 0 ]; then
    echo "SKIP: $species_name already has $existing image(s)"
    skipped=$((skipped + 1))
    continue
  fi

  ext="${filename##*.}"
  timestamp=$(date +%s%3N)
  uuid=$(generate_uuid)
  new_filename="${timestamp}-${uuid}.${ext}"
  target_path="$UPLOADS_DIR/$new_filename"

  cp "$image_file" "$target_path"

  db_filepath="/uploads/$new_filename"
  sqlite3 "$DB_PATH" "INSERT INTO plant_species_images (plant_species_id, filepath, position) VALUES ($species_id, '$db_filepath', 0);"

  echo "OK: $species_name -> $new_filename"
  inserted=$((inserted + 1))
done

echo ""
echo "Done: $inserted images inserted, $skipped skipped"
