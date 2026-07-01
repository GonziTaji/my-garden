# Phase 6 — Frontend UI Migration Plan

## Goal
Replace TanStack Router with a lightweight custom router, integrate the Go backend via a thin fetch wrapper + React Query, and inline watering into the plants page.

## Route map (7 routes)

```
/               → Home
/plants         → PlantsList (with inline watering controls)
/plants/new     → PlantNew
/plants/:id     → PlantDetail (with journal entries)
/catalog        → CatalogList
/catalog/new    → CatalogNew
/catalog/:id    → CatalogDetail (view/edit via ?e=T toggle)
```

---

## Step 1 — Strip TanStack Router

| Action | Details |
|--------|---------|
| Remove deps | `@tanstack/react-router`, `@tanstack/react-router-devtools`, `@tanstack/router-plugin`, `@tanstack/eslint-plugin-router` from `package.json` |
| Remove vite plugin | Remove `tanstackRouter()` from `vite.config.ts` |
| Delete files | `src/router.tsx`, `src/routeTree.gen.ts`, `src/routes/` (entire directory) |
| Remove `'use client'` | Strip all Next.js `'use client'` directives from components |

## Step 2 — Custom router

Create `src/router/`:

| File | Responsibility |
|------|---------------|
| `types.ts` | `Route` type: `{ path: string, component: Component }` |
| `context.tsx` | `RouterContext` — listens to `popstate`, holds current path, provides `navigate(path)` via `history.pushState` |
| `Link.tsx` | `<Link to="..." params={...}>` — renders `<a>` with `onClick` that calls `navigate()` |
| `useParams.ts` | Extracts dynamic segments (e.g. `/catalog/:id` → `{ id: "5" }`) |
| `useSearchParams.ts` | Read/write `?e=T` style query params |

## Step 3 — API client + React Query hooks

Create `src/api/`:

| File | Contents |
|------|----------|
| `client.ts` | Thin fetch wrapper — `api.get()`, `api.post()`, `api.put()`, `api.del()`. Base URL from Vite proxy in dev, same-origin in prod. |
| `definitions.ts` | `useDefinitions()`, `useDefinition(id)`, `useCreateDefinition()`, `useUpdateDefinition()`, `useDeleteDefinition()` |
| `plants.ts` | `usePlants()`, `usePlant(id)`, `useCreatePlant()` |
| `watering.ts` | `useToggleWatering()`, `useBulkWater()`, `useLastWateredDates(plantIds)`, `useWateringHistoryRange(plantIds, start, end)` |

## Step 4 — Page components

Create `src/pages/`:

| Page | File | Data |
|------|------|------|
| **Layout** | `Layout.tsx` | Nav bar, renders child |
| **Home** | `Home.tsx` | Static nav buttons |
| **PlantsList** | `PlantsList.tsx` | `usePlants()` + inline watering (3 toggleable views: lista / regar / historial) |
| **PlantDetail** | `PlantDetail.tsx` | `usePlant(id)` + journal |
| **PlantNew** | `PlantNew.tsx` | `useCreatePlant()` mutation |
| **CatalogList** | `CatalogList.tsx` | `useDefinitions()` |
| **CatalogDetail** | `CatalogDetail.tsx` | `useDefinition(id)`, edit via `?e=T` |
| **CatalogNew** | `CatalogNew.tsx` | `useCreateDefinition()` mutation |

## Step 5 — Wire up UI components

Connect existing UI components to real API data instead of stubs:

- `DefinitionView.tsx` → `useCreateDefinition` / `useUpdateDefinition` mutations
- `PlantForm.tsx` → `useCreatePlant()` mutation, custom `useNavigate()`
- `WateringGridCell.tsx` → `useToggleWatering()` mutation
- `WateringList.tsx` → `useBulkWater()` mutation
- `DeleteButton.tsx` → `useDeleteDefinition()` mutation, navigate on success
- `ImageSelector.tsx` → upload to `/api/upload/plant-definition-image`

## Step 6 — Vite config

```ts
server: {
  proxy: {
    '/api': 'http://localhost:8080',
    '/uploads': 'http://localhost:8080',
  }
}
```

Remove `tanstackRouter()` plugin. Keep only `@vitejs/plugin-react`.

## Step 7 — Cleanup

- Delete `WateringHistoryGrid.1.tsx` (orphan duplicate)
- Delete `actions/` directory (replaced by `api/` + React Query)
- Remove `'use client'` directives from all components
- Remove `@tanstack/react-query` if not using it (recommended to keep)

---

## Implementation order

1. Strip TSR → 2. Custom router → 3. API client → 4. Pages → 5. Wire up → 6. Vite config → 7. Cleanup → 8. Verify build
