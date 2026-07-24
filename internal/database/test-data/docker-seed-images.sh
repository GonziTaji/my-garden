#!/bin/sh
set -e

IMAGES_DIR="/app/internal/database/test-data/plant-species-images"
UPLOADS_DIR="/app/public/uploads"
DB_PATH="${MY_GARDEN_DB:-/app/data/main.db}"

mkdir -p "$UPLOADS_DIR"

species_for_file() {
  case "$1" in
    aglaomena.webp) echo "Aglaonema commutatum" ;;
    alocacia_polly.webp) echo "Alocasia amazonica" ;;
    aloe-vera.jpg) echo "Aloe vera" ;;
    beaucarnea-recurvata.webp) echo "Beaucarnea recurvata" ;;
    calathea-orbifolia.webp) echo "Calathea orbifolia" ;;
    ceropegia-woodii.webp) echo "Ceropegia woodii" ;;
    chamaedorea-elegans.webp) echo "Chamaedorea elegans" ;;
    chlorophytum-comosum.webp) echo "Chlorophytum comosum" ;;
    codiaeum-variegatum.webp) echo "Codiaeum variegatum" ;;
    dieffenbachia-seguine.webp) echo "Dieffenbachia seguine" ;;
    dracaena-marginata.webp) echo "Dracaena marginata" ;;
    dracaena-trifasciata.webp) echo "Dracaena trifasciata" ;;
    echeveria-elegans.webp) echo "Echeveria elegans" ;;
    epipremnum-aureum.webp) echo "Epipremnum aureum" ;;
    ficus-elastica.webp) echo "Ficus elastica" ;;
    ficus-lyrata.webp) echo "Ficus lyrata" ;;
    fittonia-albivenis.webp) echo "Fittonia albivenis" ;;
    haworthiopsis-fasciata.webp) echo "Haworthiopsis fasciata" ;;
    maranta-leuconeura.webp) echo "Maranta leuconeura" ;;
    monkey-mask.webp) echo "Monstera adansonii" ;;
    monstera-deliciosa.webp) echo "Monstera deliciosa" ;;
    nephrolepis-exaltata.webp) echo "Nephrolepis exaltata" ;;
    peperomia-obtusifolia.webp) echo "Peperomia obtusifolia" ;;
    philodendron-hederaceum.webp) echo "Philodendron hederaceum" ;;
    pilea-peperomioides.webp) echo "Pilea peperomioides" ;;
    sedum-morganianum.webp) echo "Sedum morganianum" ;;
    senecio-radicans.webp) echo "Senecio radicans" ;;
    spathiphyllum-wallisii.webp) echo "Spathiphyllum wallisii" ;;
    strelitzia-reginae.webp) echo "Strelitzia reginae" ;;
    tradescantia-zebrina.webp) echo "Tradescantia zebrina" ;;
    zamioculcas-zamiifolia.webp) echo "Zamioculcas zamiifolia" ;;
    *) echo "" ;;
  esac
}

inserted=0
for image_file in "$IMAGES_DIR"/*.webp "$IMAGES_DIR"/*.jpg; do
  [ -f "$image_file" ] || continue
  filename=$(basename "$image_file")
  species_name=$(species_for_file "$filename")
  [ -z "$species_name" ] && continue

  species_id=$(sqlite3 "$DB_PATH" "SELECT id FROM plant_species WHERE scientific_name = '${species_name}' AND deleted_at IS NULL LIMIT 1;")
  [ -z "$species_id" ] && continue

  existing=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM plant_species_images WHERE plant_species_id = ${species_id};")
  [ "$existing" -gt 0 ] && continue

  ext="${filename##*.}"
  uuid=$(cat /proc/sys/kernel/random/uuid)
  timestamp=$(date +%s%3N)
  new_filename="${timestamp}-${uuid}.${ext}"

  cp "$image_file" "$UPLOADS_DIR/$new_filename"
  sqlite3 "$DB_PATH" "INSERT INTO plant_species_images (plant_species_id, filepath, position) VALUES (${species_id}, '/uploads/${new_filename}', 0);"
  inserted=$((inserted + 1))
done

echo "Done: ${inserted} species images inserted"
