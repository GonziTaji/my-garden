# Plant API — Migration Spec

from Next.js → Go/Gin + Vite SPA

---

## State of the Go backend (current)

| Area | Status |
|------|--------|
| Server scaffold (gin, embed, security headers) | Done |
| SQLite connection | Done (needs fix: GetDatabase returns error when db IS open) |
| DB schema | Old design (plants, preferences tables) — must be replaced |
| `domain/plant/` (controller, router, service, store) | Empty stubs |
| CORS | Not configured |
| API routes | None (commented out) |

---

## Entities & DB schema (target)

Replace current `schema.sql` with these tables:

### plant_definitions

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK AUTOINCREMENT |
| common_name | text | NOT NULL |
| scientific_name | text | NOT NULL UNIQUE COLLATE NOCASE |
| water_profile | text | NOT NULL (enum) |
| light_level | text | NOT NULL (enum) |
| soil_type | text | NOT NULL (enum) |
| pet_toxicity | text | NOT NULL (enum) |
| pet_toxicity_notes | text | NOT NULL DEFAULT '' |
| categories_json | text | NOT NULL DEFAULT '[]' |
| created_at | text | DEFAULT CURRENT_TIMESTAMP |
| updated_at | text | DEFAULT CURRENT_TIMESTAMP |

### plant_definition_images

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK AUTOINCREMENT |
| plant_definition_id | integer | NOT NULL FK → plant_definitions(id) ON DELETE CASCADE |
| filepath | text | NOT NULL |
| position | integer | NOT NULL (0, 1, 2) |
| UNIQUE(plant_definition_id, position) |

### plants

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK AUTOINCREMENT |
| nickname | text | NOT NULL |
| source | text | NULLABLE |
| plant_definition_id | integer | NOT NULL FK → plant_definitions(id) ON DELETE CASCADE |
| acquired_at | text | NULLABLE |
| location | text | NULLABLE |
| notes | text | NULLABLE |
| created_at | text | DEFAULT CURRENT_TIMESTAMP |
| updated_at | text | DEFAULT CURRENT_TIMESTAMP |

### plant_journal_entries

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK AUTOINCREMENT |
| plant_id | integer | NOT NULL FK → plants(id) ON DELETE CASCADE |
| journal_entry_type | text | NOT NULL (enum: watering / fertilizing / repotting / note) |
| notes | text | NULLABLE |
| entry_created_at | text | DEFAULT CURRENT_TIMESTAMP |
| entry_updated_at | text | DEFAULT CURRENT_TIMESTAMP |

### plant_journal_entry_images

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK AUTOINCREMENT |
| plant_journal_entry_id | integer | NOT NULL FK → plant_journal_entries(id) ON DELETE CASCADE |
| url | text | NOT NULL |

---

## Domain enumerations (server & client share these)

### WaterProfile

| Key | Label |
|-----|-------|
| dry_cycle | Hasta secarse |
| semi_dry_cycle | Parcialmente seco |
| even_moisture | Mantener húmedo |
| wet | Encharcado |

### LightLevel

| Key | Label |
|-----|-------|
| low | Poca luz |
| indirect | Luz indirecta |
| bright_indirect | Luz brillante indirecta |
| direct | Sol directo |

### SoilType

| Key | Label |
|-----|-------|
| aerated | Aireado |
| well_draining | Buen drenaje |
| moisture_retentive | Retiene humedad |

### PlantCategory

| Key | Label |
|-----|-------|
| cactus_succulent | Cactus / Suculenta |
| fern | Helecho |
| mediterranean | Mediterranea |
| creeper | Rastrera |
| tree | Árbol |
| tropical | Tropical |
| climber | Trepadora |

### PetToxicity

| Key | Label |
|-----|-------|
| beneficial | Beneficioso |
| non_toxic | No tóxico |
| lightly_toxic | Medianamente tóxico |
| highly_toxic | Muy tóxico |

### JournalEntryType

| Key | Label |
|-----|-------|
| watering | Watering |
| fertilizing | Fertilizing |
| repotting | Repotting |
| note | Note |

---

## API endpoints

### PlantDefinitions (Catalog)

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/plant-definitions | List all definitions (include images) |
| GET | /api/plant-definitions/:id | Get single definition with images |
| POST | /api/plant-definitions | Create definition |
| PUT | /api/plant-definitions/:id | Update definition |
| DELETE | /api/plant-definitions/:id | Delete definition (cascade to plants, images) |

**Validation rules for upsert:**
- common_name: required, non-empty
- scientific_name: required, non-empty, unique (case-insensitive)
- water_profile, light_level, soil_type, pet_toxicity: must be valid enum values
- categories: each must be a valid PlantCategory key
- images: max 3, positions 0-2, no duplicate filepaths

### Image Upload

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/upload/plant-definition-image | Upload image, returns filepath |

**Rules:**
- Accepted MIME: image/jpeg, image/png, image/webp
- Accepted extensions: .jpg, .jpeg, .png, .webp
- Max file size: 8MB
- Max per definition: 3
- Stored at: `public/uploads/plant-definitions/{timestamp}-{uuid}.{ext}`
- Orphan cleanup: removed images with zero refs are deleted from disk

### Plants (My Plants)

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/plants | List plants (with nested definition: id, common_name, scientific_name). Optional ?plant_definition_id filter |
| GET | /api/plants/:id | Get single plant with definition |
| POST | /api/plants | Create plant |
| DELETE | /api/plants/:id | Delete plant (cascade to journal entries) |

**Validation:**
- nickname: required, non-empty
- plant_definition_id: must reference existing definition
- No update endpoint (old app only had create + delete)

### Journal / Watering

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/journal/watering/bulk | Water multiple plants today. Body: { plant_ids: number[] } |
| POST | /api/journal/watering | Water single plant on specific date. Body: { plant_id, date? } |
| DELETE | /api/journal/watering | Remove watering for plant+date. Body: { plant_id, date } |
| POST | /api/journal/watering/toggle | Toggle watering on/off for plant+date. Body: { plant_id, date } |
| GET | /api/plants/:id/journal | Get journal entries for a plant |
| POST | /api/journal/last-watered | Get last watered date for multiple plants. Body: { plant_ids: number[] } |
| POST | /api/journal/watering/range | Get watering entries by date range + plant IDs. Body: { plant_ids, start_date, end_date } |

### Enums (metadata)

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/enums | All enums with labels |

Or individual:
- GET /api/enums/water-profiles
- GET /api/enums/light-levels
- GET /api/enums/soil-types
- GET /api/enums/categories
- GET /api/enums/pet-toxicity
- GET /api/enums/journal-entry-types

---

## Suggested implementation order

### Phase 1 — Backend foundation
1. Replace DB schema with the new tables (copy old migrations into Go migrations)
2. Fix `GetDatabase` bug (returns error when db IS open — wrong nil check)
3. Define Go structs for all entities + enum types
4. Implement CORS middleware (required for dev mode with Vite on different port)
5. Wire up API routes in `domain/plant/router.go`

### Phase 2 — PlantDefinitions + Images
6. Implement `store.go`: CRUD for plant_definitions + plant_definition_images
7. Implement `service.go`: business logic with validation
8. Implement `controller.go`: HTTP handlers + image upload
9. Test with curl/httpie

### Phase 3 — Plants
10. Implement store/service/controller for plants

### Phase 4 — Journal / Watering
11. Implement watering toggle, bulk water, history range
12. Implement journal entry retrieval

### Phase 5 — Validate with CORS
13. Run Go backend, verify all endpoints work with the Vite dev server via CORS
14. Test the full flow: create definition → upload images → create plant → water plant → toggle watering → view history → delete

### Phase 6 — Frontend
15. Migrate pages from Next.js to Vite SPA using the API

---

## CORS notes

For development (Vite on :5173, Go on :8080), the Go server must respond with:

```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

For production, the Go server serves the SPA static files on the same origin, so no CORS needed.

## Image serving

In dev, Vite proxies `/uploads/*` → Go backend or Go serves them directly.
The current router has `StaticFS` for prod — in dev, serve `public/uploads/` as a static file route.
