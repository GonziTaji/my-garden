# Dead Code Cleanup Plan

After completing the event-unification migration (`plant_journal_entries` + `plant_location_history` → `plant_events`), the following dead code was identified. This plan covers removal of unused code across both backend and frontend.

---

## A. Backend (Go)

### A1. Unused Store Methods

| # | Method | File | Line | Notes |
|---|--------|------|------|-------|
| 1 | `Store.ListPlants` | `domain/plant/store.go` | 408 | Unused; service delegates to `ListPlantsWithDefinition`. **Remove.** |
| 2 | `Store.GetPlantDefinitionImages` | `domain/plant/store.go` | 297 | Unused; not in interface. **Remove.** |
| 3 | `Store.GetOrphanedFilepaths` | `domain/plant/store.go` | 367 | Unused; not in interface. **Remove.** |
| 4 | `Store.CountPlantImageReferences` | `domain/plant/store.go` | 675 | In interface but never called. **Remove method + interface entry.** |

### A2. Unused Types / Structs

| # | Type | File | Line | Notes |
|---|------|------|------|-------|
| 5 | `server.Server` | `internal/server/server.go` | 39 | Empty struct, never instantiated. **Remove struct + file if nothing remains** (server.go only has `DefaultConfig` + `Server` + `StartWebServer`; check if `StartWebServer` can move). |
| 6 | `PlantEventImage` | `domain/plant/types.go` | 180 | Defined but never instantiated. **Remove type.** |

### A3. Unused Struct Fields

| # | Field | File | Line | Notes |
|---|-------|------|------|-------|
| 7 | `Plant.Location` | `domain/plant/types.go` | 123 | Vestigial; never scanned/inserted/updated. `PlantWithDefinition.Location` is computed via COALESCE. **Remove field.** |

### A4. Unused Functions

| # | Function | File | Line | Notes |
|---|----------|------|------|-------|
| 8 | `database.DefaultConfig` | `internal/database/database.go` | 21 | Config built inline in `cmd/start.go`. **Remove.** |
| 9 | `database.CloseDatabase` | `internal/database/database.go` | 54 | Never called. **Remove.** |
| 10 | `server.DefaultConfig` | `internal/server/server.go` | 31 | Config built inline in `cmd/start.go`. **Remove.** |

---

## B. Frontend (TypeScript)

### B1. Unused API Hooks

| # | Export | File | Line | Notes |
|---|--------|------|------|-------|
| 11 | `usePlantEvents` | `api/events.ts` | 36 | Never imported. **Remove.** |
| 12 | `useDeleteEvent` | `api/events.ts` | 67 | Never imported. **Remove.** |
| 13 | `useCalendarEvents` | `api/events.ts` | 78 | Never imported; `usePlantCalendar` in `watering.ts` is used instead. **Remove.** |
| 14 | `useEventsRange` | `api/events.ts` | 88 | Never imported. **Remove.** |
| 15 | `useLastEventDates` | `api/events.ts` | 104 | Never imported; the version in `watering.ts` is used. **Remove.** |
| 16 | `useUpdatePlant` | `api/plants.ts` | 139 | Never imported. **Remove.** |
| 17 | `useDeletePlant` | `api/plants.ts` | 150 | Never imported. **Remove.** |

### B2. Unused Types / Interfaces / Functions

| # | Export | File | Line | Notes |
|---|--------|------|------|-------|
| 18 | `ApiError` | `api/client.ts` | 1 | Only thrown internally, never caught externally. **Remove export** (keep class but don't export). |
| 19 | `PlantGroup` | `domain/plants/plant.ts` | 26 | Never imported. **Remove.** |
| 20 | `PlantsByDefinitionMap` | `domain/plants/plant.ts` | 31 | Never imported. **Remove.** |
| 21 | `groupPlantsByDefinition` | `domain/plants/plant.ts` | 33 | Never imported. **Remove.** |
| 22 | `CalendarEntry` | `domain/plants/plant-event.ts` | 34 | Only used in dead hooks. **Remove** (can readd when needed). |
| 23 | `getDateRange` | `utils/dates.ts` | 28 | Never called. **Remove.** |
| 24 | `RouteConfig` | `router/types.ts` | 4 | Never imported. **Remove.** |
| 25 | `getSelectedPlantIds` | `ui/components/WateringList.tsx` | 94 | Exported but never imported. **Remove export** (keep function if used internally) or remove entirely. |

### B3. Unused Files (Entirely Dead)

| # | File | Notes |
|---|------|-------|
| 26 | `ui/components/PlantDefinitionHeader.tsx` | Entire component never imported. **Remove file.** |
| 27 | `hooks/use-swipe.ts` | Entire hook marked as `/** unused */`. **Remove file.** |

### B4. Unused Imports / Variables

| # | Item | File | Line | Notes |
|---|------|------|------|-------|
| 28 | `Link` (unused import) | `ui/pages/Explore.tsx` | 1 | Imported but never used. **Remove import.** |
| 29 | `linkVariants` (unused variable) | `ui/pages/Explore.tsx` | 4 | Declared but never used. **Remove.** |

### B5. Duplicate Route

| # | Issue | File | Line | Notes |
|---|-------|------|------|-------|
| 30 | `/plants/:plantid` registered twice | `router/routes.ts` | 16-17 | Second entry is dead/unreachable. **Remove duplicate entry.** |

---

## C. Execution Order

1. **Backend types** — Remove `PlantEventImage` (types.go), remove `Plant.Location` field
2. **Backend store** — Remove `ListPlants`, `GetPlantDefinitionImages`, `GetOrphanedFilepaths`, `CountPlantImageReferences`
3. **Backend interface** — Remove `CountPlantImageReferences` from `StoreInterface`
4. **Backend functions** — Remove `database.DefaultConfig`, `database.CloseDatabase`, `server.DefaultConfig`, `server.Server`
5. **Frontend hooks** — Remove dead exports from `events.ts` and `plants.ts`
6. **Frontend domain** — Remove `CalendarEntry`, `PlantGroup`, `PlantsByDefinitionMap`, `groupPlantsByDefinition`
7. **Frontend files** — Remove `PlantDefinitionHeader.tsx`, `use-swipe.ts`
8. **Frontend cleanup** — Remove unused import/variable in `Explore.tsx`, remove duplicate route, remove `getSelectedPlantIds` export, remove `getDateRange`, remove `RouteConfig`
9. **Build & verify** — `go build ./...` and `pnpm tsc --noEmit`

## D. Next Steps After Cleanup

After removing dead code, the following areas may still need attention (not dead, but potentially worth reviewing):

- **`migrateEvents`** in `database.go:166-287` — one-shot migration; can be removed once all production DBs are migrated
- **Unused field `PlantImage.UserID`** (`types.go:143`) — set in memory but never persisted to DB; consider persisting or removing the assignment
