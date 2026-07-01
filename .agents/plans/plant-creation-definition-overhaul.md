# Plant Creation & Definition Overhaul

## Summary

Redesign how users interact with plant definitions and plant creation. Introduce quick definitions (minimal creation inline), a 3-path species selector on the plant form, creation from definition context, catalog tabs, and plant counts on definition cards.

---

## Prerequisites (read before implementing)

- `domain/plant/types.go` — all entities
- `domain/plant/service.go:608-682` — existing `validateUpsert`
- `domain/plant/store.go:19-98` — `ListPlantDefinitions`
- `domain/plant/store.go:101-153` — `GetPlantDefinition`
- `domain/plant/controller.go:80-105` — `CreatePlantDefinition` handler
- `frontend/src/api/definitions.ts` — API client
- `frontend/src/ui/components/PlantForm.tsx` — form to refactor
- `frontend/src/ui/components/DefinitionView.tsx` — detail component
- `frontend/src/ui/components/PlantDetails.tsx` — plant detail
- `frontend/src/ui/pages/CatalogList.tsx` — catalog page
- `frontend/src/ui/components/DefinitionsCatalog.tsx` — card grid
- `frontend/src/router/routes.ts` — all routes
- `internal/database/schema.sql` — schema

---

## Step 1 — Backend: Schema + types

### File: `internal/database/schema.sql`

Remove UNIQUE constraint from `scientific_name`:
```sql
-- change line 30 from:
scientific_name text not null collate nocase unique,
-- to:
scientific_name text not null default '',
```

Add `is_quick` column:
```sql
-- add after visibility line:
is_quick integer not null default 0,
```

### File: `domain/plant/types.go`

Add fields to `PlantDefinition` struct (after `Images` on line 107):
```go
IsFavorited    bool `json:"is_favorited"`
UserPlantCount int  `json:"user_plant_count"`
IsQuick        bool `json:"is_quick"`
```

---

## Step 2 — Backend: Store queries

### File: `domain/plant/store.go`

#### `ListPlantDefinitions(userID int64)`

Add to SELECT:
```sql
pd.is_quick,
coalesce((select count(*) from plants where plant_definition_id = pd.id and user_id = ?), 0) as user_plant_count,
case when exists (select 1 from plant_definition_favorites where plant_definition_id = pd.id and user_id = ?) then 1 else 0 end as is_favorited
```

Update `args` to include `userID` twice at the start (for the subqueries).

Update `rows.Scan` — scan into local vars for count/favorited, then assign to struct.

#### `GetPlantDefinition(id int64, userID int64)`

Same SELECT additions. Same subqueries with `userID`.

#### `CreatePlantDefinition(d *PlantDefinition)`

Add `is_quick` to INSERT columns and values.

#### `ClonePlantDefinition(defID int64, userID int64)`

Add `is_quick` to INSERT (clone the original's value).

#### `UpdatePlantDefinition(d *PlantDefinition)`

Add `is_quick = ?` to SET clause.

---

## Step 3 — Backend: Service validation

### File: `domain/plant/service.go`

#### `UpsertDefinitionInput`

Add field at end:
```go
IsQuick bool `json:"is_quick"`
```

#### `validateUpsert`

Change signature to accept `isQuick bool`.

- `common_name`: always required
- `water_profile`: always required + valid enum
- `scientific_name`: no longer required (both modes)
- When `isQuick`:
  - `light_level`: optional, default `"indirect"`
  - `soil_type`: optional, default `"well_draining"`
  - `pet_toxicity`: optional, default `"non_toxic"`
- When not `isQuick`:
  - `light_level`: required + valid enum
  - `soil_type`: required + valid enum
  - `pet_toxicity`: required + valid enum

#### `CreateDefinition`

Pass `input.IsQuick` to `validateUpsert`.

#### `UpdateDefinition`

Pass `false` to `validateUpsert` (edits always use full validation).

Remove the `UniqueConstraintError` check for `scientific_name` (no longer unique).

---

## Step 4 — Frontend: Domain + API types

### File: `frontend/src/domain/plants/plant-definition.ts`

After line 23, add:
```ts
isFavorited?: boolean
userPlantCount?: number
isQuick?: boolean
```

### File: `frontend/src/api/definitions.ts`

In `ApiDefinition`, add:
```ts
is_favorited: boolean
user_plant_count: number
is_quick: boolean
```

In `toDomain`, map them:
```ts
isFavorited: d.is_favorited,
userPlantCount: d.user_plant_count,
isQuick: d.is_quick,
```

---

## Step 5 — Frontend: Routes

### File: `frontend/src/router/routes.ts`

Add import:
```ts
import CatalogNewPlant from "@/ui/pages/CatalogNewPlant"
```

Add route after `/catalog/:plantdefid`:
```ts
{ path: "/catalog/:plantdefid/new-plant", component: CatalogNewPlant },
```

Keep `/plants/new` and all other routes.

---

## Step 6 — Frontend: CatalogNewPlant page

### New file: `frontend/src/ui/pages/CatalogNewPlant.tsx`

```tsx
import { useParams, useNavigate } from "@/router/provider"
import { useDefinition } from "@/api/definitions"
import PlantForm from "@/ui/components/PlantForm"

export default function CatalogNewPlant() {
  const { plantdefid } = useParams()
  const defId = Number(plantdefid)
  const { data: definition, isLoading } = useDefinition(defId)

  if (isLoading) return <div className="p-8 text-center text-olive-500">Cargando...</div>

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-center text-olive-700 mb-4">
        Nueva planta
      </h2>
      {definition && (
        <p className="text-center text-olive-500 mb-4 italic">
          {definition.commonName}
          {definition.scientificName && ` — ${definition.scientificName}`}
        </p>
      )}
      <PlantForm plantDefinitionId={defId} />
    </div>
  )
}
```

---

## Step 7 — Frontend: PlantForm refactor

### File: `frontend/src/ui/components/PlantForm.tsx`

#### Props change
```ts
export interface PlantFormProps {
  plantDefinitionId?: number
}
```

#### Species section — two modes:

**Mode A: `plantDefinitionId` is provided** (from `/catalog/:defid/new-plant`):
- Read-only display of definition name
- Hidden input with the ID
- No species selector

**Mode B: `plantDefinitionId` is NOT provided** (from `/plants/new`):
- Radio toggle with 3 choices:

  | Mode | UI | Action |
  |------|----|--------|
  | Usar de mi catálogo | `<select>` of owned+favorited defs | Links plant to selected def |
  | Especie rápida | Inline: common name + water profile | Creates quick def, then links |
  | Crear nueva especie | Link to `/catalog/new` | Navigates away |

#### Submit logic

- If `plantDefinitionId` is set: send it directly
- If mode is "quick": first call `useCreateDefinition()` with `{ common_name, water_profile, is_quick: true }`, get new def ID, then create plant
- If mode is "catalog": use selected def ID from dropdown

**Remove**: The existing `<select>` for definitions (lines 58-88).

---

## Step 8 — Frontend: Definition detail (Crear planta button)

### File: `frontend/src/ui/components/DefinitionView.tsx`

In the action buttons area (around line 139, where `!editMode` and `user` is truthy):

```tsx
{user && !editMode && record.id && (
  <Link
    to="/catalog/:plantdefid/new-plant"
    params={{ plantdefid: String(record.id) }}
    className={buttonVariants({ variant: "primary" })}
  >
    Crear planta
  </Link>
)}
```

Place before "Clonar" / "Editar" buttons.

Also update `favorited` state initialization (line 33):
```ts
const [favorited, setFavorited] = useState(record.isFavorited || false)
```

---

## Step 9 — Frontend: Plant detail (Clonar button)

### File: `frontend/src/ui/components/PlantDetails.tsx`

Add after nickname input (around line 114):
```tsx
<Link
  to="/catalog/:plantdefid/new-plant"
  params={{ plantdefid: String(plant.plantDefinitionId) }}
  className={buttonVariants({ variant: "secondary", size: "sm" })}
>
  Clonar especie
</Link>
```

Import `Link` from `@/router/components/Link` if not already imported.

---

## Step 10 — Frontend: Catalog tabs

### File: `frontend/src/ui/pages/CatalogList.tsx`

Add tab navigation with `?t=` search param (same pattern as `PlantsList`):

```tsx
type Tab = "mine" | "favorites" | "all"
const [searchParams, setSearchParams] = useSearchParams()
const tab = (searchParams.get("t") as Tab) || "all"
```

Filter definitions client-side:
```tsx
const { data: definitions, isLoading, error } = useDefinitions()
const { user } = useAuth()

const filteredDefinitions = useMemo(() => {
  if (!definitions) return []
  switch (tab) {
    case "mine": return definitions.filter(d => d.userId === user?.id)
    case "favorites": return definitions.filter(d => d.isFavorited)
    case "all": default: return definitions
  }
}, [definitions, tab, user?.id])
```

Tab bar UI (same styling as PlantsList tabs):
```tsx
<div className="flex gap-1 p-2">
  {(["mine", "favorites", "all"] as const).map((t) => (
    <button key={t} onClick={() => setSearchParams({ t: t === "all" ? "" : t })}
      className={cn("px-4 py-1 rounded-sm text-sm", tab === t ? "bg-rose-100 text-rose-700 border border-rose-200" : "hover:text-olive-700")}>
      {t === "mine" && "Mías"}
      {t === "favorites" && "Favoritas"}
      {t === "all" && "Todas"}
    </button>
  ))}
</div>
```

If user is not logged in, only show "Todas" tab.

Import `useSearchParams` from `@/router/provider`, `useMemo` from `react`, `cn` from `@sglara/cn`.

---

## Step 11 — Frontend: Plant count on cards

### File: `frontend/src/ui/components/DefinitionsCatalog.tsx`

Inside each card's `.flex.flex-col.items-center.text-center` div:
```tsx
{d.userPlantCount !== undefined && d.userPlantCount > 0 && (
  <span className="text-xs text-olive-500 mt-1">
    {d.userPlantCount} {d.userPlantCount === 1 ? 'planta' : 'plantas'}
  </span>
)}
```

Optional quick badge:
```tsx
{d.isQuick && (
  <span className="text-xs bg-yellow-100 text-yellow-700 px-1 rounded mt-1">
    Rápida
  </span>
)}
```

---

## Step 12 — Verify: Full test checklist

1. **Quick plant from Mi Jardín**: `+` → "Especie rápida" → enter name + water → submit → plant + quick def created
2. **Plant from catalog def**: Catálogo → pick def → "Crear planta" → fill form → plant linked to def
3. **Plant from existing def (favorited)**: Explore → favorite a def → Catálogo Favoritas tab → "Crear planta" → works
4. **Clone plant**: Mi Jardín → pick plant → "Clonar especie" → form pre-filled with same def → submit works
5. **Catalog tabs**: Mine shows own, Favorites shows favorited, All shows everything
6. **Plant count**: Create 2+ plants of same def → card shows count
7. **Explore page**: Still works as before (all public defs)
8. **Full def creation**: Catálogo → Nueva → fill all fields → creates public def
9. **Edge cases**: No def selected (should error), invalid def ID, anonymous user (no plant creation)

---

## File change summary

| # | File | Change |
|---|------|--------|
| 1 | `internal/database/schema.sql` | Remove UNIQUE from scientific_name, add is_quick |
| 2 | `domain/plant/types.go` | Add IsFavorited, UserPlantCount, IsQuick |
| 3 | `domain/plant/store.go` | Add subqueries to List/Get, is_quick to INSERT/UPDATE |
| 4 | `domain/plant/service.go` | Split validateUpsert quick/full, add IsQuick to input |
| 5 | `frontend/src/domain/plants/plant-definition.ts` | Add isFavorited, userPlantCount, isQuick |
| 6 | `frontend/src/api/definitions.ts` | Update ApiDefinition + toDomain |
| 7 | `frontend/src/router/routes.ts` | Add `/catalog/:plantdefid/new-plant` |
| 8 | `frontend/src/ui/pages/CatalogNewPlant.tsx` | **New file** |
| 9 | `frontend/src/ui/components/PlantForm.tsx` | Refactor: plantDefinitionId prop + 3-mode selector |
| 10 | `frontend/src/ui/pages/PlantNew.tsx` | Simplify wrapper |
| 11 | `frontend/src/ui/components/DefinitionView.tsx` | Add Crear planta button, init favorited |
| 12 | `frontend/src/ui/components/PlantDetails.tsx` | Add Clonar especie button |
| 13 | `frontend/src/ui/pages/CatalogList.tsx` | Add Mine/Favorites/All tabs |
| 14 | `frontend/src/ui/components/DefinitionsCatalog.tsx` | Show plant count badge |
