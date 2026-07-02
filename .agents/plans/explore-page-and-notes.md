# Explore Page + Notes Field

## Goal
- Add a `notes` column to `plant_definitions` 
- Redesign the Explore page (`/`) as a Pinterest-style masonry grid showing only public definitions
- Each card shows the image (or placeholder), common name, and author username
- Clicking a card navigates to the definition detail page, where clone/edit actions live
- The `/catalog` page remains unchanged

---

## Part 1: `notes` on `plant_definitions`

### 1. Schema — `internal/database/schema.sql`
Add column to `plant_definitions` table:
```
notes text not null default ''
```

### 2. Go type — `domain/plant/types.go`
Add field to `PlantDefinition` struct:
```go
Notes string `json:"notes"`
```

### 3. Go service — `domain/plant/service.go`
- Add `Notes *string `json:"notes"`` to `UpsertDefinitionInput`
- In `validateUpsert`, copy `input.Notes` to `d.Notes` (default to `""` if nil)

### 4. Go store — `domain/plant/store.go`
Update all 5 queries touching `plant_definitions`:

| Function | Change |
|---|---|
| `ListPlantDefinitions` | Add `notes` to SELECT columns |
| `GetPlantDefinition` | Add `notes` to SELECT columns and Scan |
| `CreatePlantDefinition` | Add `notes` to INSERT columns and values |
| `UpdatePlantDefinition` | Add `notes = ?` to SET clause |
| `ClonePlantDefinition` | Add `notes` to INSERT columns and values |

### 5. Frontend type — `frontend/src/domain/plants/plant-definition.ts`
```ts
notes: string
```

### 6. Frontend API — `frontend/src/api/definitions.ts`
- Add `notes: string` to `ApiDefinition`, match in `toDomain`
- Add `notes?: string` to `CreateDefinitionInput`

### 7. UI — `frontend/src/ui/components/DefinitionView.tsx`
- **Edit mode**: add a `<textarea>` for notes at the bottom of the form (after the `DANGER ZONE` section, before closing `<dl>`)
- **View mode**: display notes text below pet toxicity, at the bottom of the definition list

---

## Part 2: Author username in definition API

### 8. Go type — `domain/plant/types.go`
Add to `PlantDefinition`:
```go
AuthorUsername string `json:"author_username"`
```

### 9. Go store — `domain/plant/store.go`
Update `ListPlantDefinitions` and `GetPlantDefinition`:
- `LEFT JOIN users ON users.id = plant_definitions.user_id`
- SELECT `coalesce(users.username, '')` as `author_username`
- Update `Scan` calls to include the new field

---

## Part 3: Explore page masonry grid

### 10. Fix frontend explore hook — `frontend/src/api/definitions.ts`
- `useExploreDefinitions`: change URL to `/api/plant-definitions/all`, add `select: (data) => data.map(toDomain)`, change `queryKey` to `["definitions", "explore"]`
- Add `authorUsername: string` to `ApiDefinition` and `toDomain`

### 11. New component — `frontend/src/ui/components/ExploreGrid.tsx`
Props: `{ list: PlantDefinition[] }`

Layout — CSS columns via Tailwind:
```html
<div className="columns-2 md:columns-3 lg:columns-4 gap-4">
  {list.map(d => (
    <Link key={d.id} to="/catalog/:plantdefid" params={{ plantdefid: String(d.id) }}
          className="break-inside-avoid mb-4 block">
      <div className="...">
        {d.images[0] ? (
          <img src={d.images[0].filepath} className="w-full object-cover" />
        ) : (
          <div className="aspect-square ...">Sin imagen</div>
        )}
        <div>
          <span className="font-semibold">{d.commonName}</span>
          <span className="text-sm text-slate-500">{d.authorUsername}</span>
        </div>
      </div>
    </Link>
  ))}
</div>
```

- Image takes natural aspect ratio (no fixed height) for masonry effect — `object-cover` with `w-full`
- Cards use `break-inside-avoid` to prevent splitting across columns
- Empty state when no definitions found

### 12. Rewrite Explore page — `frontend/src/ui/pages/Explore.tsx`
- Use `useExploreDefinitions()` hook
- Loading state: centered "Cargando..."
- Error state: centered "Error al cargar"
- Empty state: "No hay tipos de planta públicos todavía."
- Success: render `<ExploreGrid list={definitions} />`

---

## No changes to
- `/catalog` page (keeps existing list view with user's own private + public definitions)
- `DefinitionView` clone/edit logic (actions stay on detail page)
- Router routes
- Any other backend endpoints
