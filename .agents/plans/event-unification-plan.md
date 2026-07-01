# Event Unification Plan

Unify `plant_journal_entries` and `plant_location_history` into a single `plant_events` table.

## Overview

| Current | After |
|---|---|
| `plant_journal_entries` (watering/fertilizing/repotting/note) | `plant_events` |
| `plant_location_history` | deleted, migrated to `plant_events` |
| `plant_journal_entry_images` | `plant_event_images` |
| `plants.location` column | removed |
| Watering overlay: `watering_date` | deleted, `event_date` replaces it |
| 8 watering/journal/location endpoints | 7 unified event endpoints |
| 3+ frontend domain types | 1 `PlantEvent` type |
| 3+ API hook files | 1 `events.ts` hooks file |

## DB Schema

```sql
create table if not exists plant_events (
  id          integer primary key autoincrement not null,
  plant_id    integer not null references plants(id) on delete cascade,
  event_type  text not null,                     -- 'watering' | 'fertilizing' | 'repotting' | 'note' | 'location_change'
  event_date  text not null,                     -- the actual day the event happened
  notes       text not null default '',
  metadata    text not null default '{}',         -- JSON blob, validated server-side
  created_at  text default (datetime('now', 'localtime')) not null,
  user_id     integer references users(id)
);

create table if not exists plant_event_images (
  id             integer primary key autoincrement not null,
  plant_event_id integer not null references plant_events(id) on delete cascade,
  url            text not null
);

create unique index if not exists idx_unique_plant_watering_date
  on plant_events (plant_id, event_date)
  where event_type = 'watering';
```

## Migration (database.go)

Wrap all steps in `BEGIN TRANSACTION` / `COMMIT` for atomicity.

All dates are `YYYY-MM-DD` strings (no time component).

1. Create `plant_events` + `plant_event_images`
2. INSERT from `plant_journal_entries`:
   - `event_type` = `journal_entry_type`
   - `event_date` = `COALESCE(watering_date, date(entry_created_at))`
   - `notes` = `COALESCE(notes, '')`
   - `metadata` = `'{}'`
   - `created_at` = `entry_created_at`
   - `user_id` = `user_id`
3. INSERT from `plant_location_history`:
   - `event_type` = `'location_change'`
   - `event_date` = `registered_at`
   - `metadata` = `json_object('location', location)`
   - `notes` = `notes`
   - `created_at` = `created_at`
   - `user_id` = `user_id`
4. Copy images from `plant_journal_entry_images` → `plant_event_images`
5. DROP old tables: `plant_journal_entries`, `plant_journal_entry_images`, `plant_location_history`
6. DROP column `location` from `plants`:
   `ALTER TABLE plants DROP COLUMN location`

## Go Types (types.go)

Replace `PlantJournalEntry`, `PlantJournalEntryImage`, `PlantLocationHistoryEntry`, `PlantCalendarEntry` with:

```go
type EventType string
const (
    EventTypeWatering      EventType = "watering"
    EventTypeFertilizing   EventType = "fertilizing"
    EventTypeRepotting     EventType = "repotting"
    EventTypeNote          EventType = "note"
    EventTypeLocationChange EventType = "location_change"
)

type WateringMetadata struct {
    Amount string `json:"amount,omitempty"`
    Type   string `json:"type,omitempty"`  // "rocio" | "riego"
}

type LocationChangeMetadata struct {
    Location string `json:"location"`
}

type PlantEvent struct {
    ID        int64              `json:"id"`
    PlantID   int64              `json:"plant_id"`
    EventType EventType          `json:"event_type"`
    EventDate string             `json:"event_date"`
    Notes     string             `json:"notes"`
    Metadata  json.RawMessage    `json:"metadata"`
    Images    []string           `json:"images"`        // URLs only, loaded in separate batch query
    CreatedAt string             `json:"created_at"`
    UserID    int64              `json:"user_id"`
}

// DB-only type for querying plant_event_images table; not exposed in API responses.
type PlantEventImage struct {
    ID           int64  `json:"id"`
    PlantEventID int64  `json:"plant_event_id"`
    URL          string `json:"url"`
}

type CalendarEntry struct {
    ID        string    `json:"id"`        // strconv.FormatInt(eventID) — stringified event id
    Date      string    `json:"date"`
    EventType EventType `json:"eventType"`
}
```

**Remove `JournalEntryType` enum entirely.** All references replaced by `EventType`. Remove `PlantJournalEntry`, `PlantJournalEntryImage`, `PlantLocationHistoryEntry`, `PlantCalendarEntry` structs.

**`PlantWithDefinition`:** Keep `Location` field, compute dynamically from the latest `location_change` event via COALESCE subquery (see store section). Do not remove it.

## Store Interface (interfaces.go)

Replace:

| Old | New |
|---|---|
| `CreatePlantLocationHistory` | — |
| `CreateJournalEntry` | `CreateEvent` |
| `DeleteJournalEntry` | `DeleteEvent` |
| `GetJournalEntries` | `GetEvents` |
| `GetWateringEntry` | — |
| `GetWateringHistoryByDateRange` | `GetEventsByDateRange` |
| `GetLastWateredDates` | `GetLastEventDates` |
| `GetPlantCalendar` | `GetCalendarEvents` |

```go
CreateEvent(e *PlantEvent) (int64, error)
DeleteEvent(id int64) error
GetEvent(eventID int64) (*PlantEvent, error)
GetEvents(plantID int64) ([]PlantEvent, error)
GetEventsByDateRange(plantIDs []int64, start, end string, eventType *string) ([]PlantEvent, error)
GetLastEventDates(plantIDs []int64, eventType *string) (map[int64]*string, error)
GetCalendarEvents(plantID int64, start, end string) ([]CalendarEntry, error)
```

## Service (service.go)

**Input:**
```go
type CreateEventInput struct {
    EventType string          `json:"event_type"`
    EventDate string          `json:"event_date"`
    Notes     *string         `json:"notes"`
    Metadata  json.RawMessage `json:"metadata"`
}
```

**Validation:**
```go
func validateEventMetadata(eventType EventType, raw json.RawMessage) error
```
- `watering` → unmarshal `WateringMetadata`, validate `type` field if set (only `"rocio"` or `"riego"`)
- `location_change` → unmarshal `LocationChangeMetadata`, require non-empty `Location`
- others → no validation (metadata is optional)

**Date format:** all dates use `YYYY-MM-DD` strings. `CreateEvent` should validate `EventDate` matches this format.

**Error handling:** `CreateEvent` returns `UniqueConstraintError` (409) when a watering event already exists for the same plant+date.

**Add these methods:**
- `GetEvent(id int64, userID int64) (*PlantEvent, error)` — delegates to store, validates ownership
- `CreateEvent(input CreateEventInput, plantID int64, userID int64) (*PlantEvent, error)` — generic create with metadata validation
- `DeleteEvent(id int64, userID int64) error` — generic delete
- `ListEvents(plantID int64, userID int64) ([]PlantEvent, error)` — delegates to `GetEvents`
- `GetEventsRange(input EventsRangeInput, userID int64) ([]PlantEvent, error)` — delegates to `GetEventsByDateRange`
- `GetLastEventDates(plantIDs []int64, eventType *string) (map[int64]*string, error)` — generic last-event-date lookup
- `GetCalendarEvents(plantID int64, start, end string, userID int64) ([]CalendarEntry, error)`

**Remove these methods:**
- `ToggleWatering` — use generic create/delete instead
- `WaterPlant` — use generic create
- `DeleteWatering` — use generic delete
- `BulkWaterPlants` — no replacement (callers create per plant)
- `CreateLocationChange` — use generic create
- `GetJournalEntries` — use `ListEvents`
- `GetWateringHistoryByDateRange` — use `GetEventsRange`
- `GetLastWateredDates` — use `GetLastEventDates`

**Update `CreatePlant`:** When creating a plant with an initial location, create a `location_change` event instead of writing to `plants.location`.

**Update `UpdatePlant`:** Remove location from plant update. Location changes are events.

## Store (store.go)

- New queries target `plant_events` table only
- `GetEvent(id)` — single event query with batch-load images
- `GetEvents(plantID)` — events for plant with batch-load images
- `GetEventsByDateRange`, `GetCalendarEvents`, `GetLastEventDates` — events-only queries (no images)
- `CreateEvent` — INSERT into `plant_events`
- `DeleteEvent` — DELETE from `plant_events` (CASCADE handles images)

**Image loading (separate batch query pattern):**
1. Query events (with or without filters)
2. Collect event IDs
3. `SELECT url FROM plant_event_images WHERE plant_event_id IN (...)` ordered by `id`
4. Map URLs to each event's `Images []string`

**`ListPlantsWithDefinition` / `GetPlantWithDefinition` COALESCE changes:**

```sql
coalesce(
  (select json_extract(metadata, '$.location') from plant_events
   where plant_id = p.id and event_type = 'location_change'
   order by event_date desc, id desc limit 1),
  ''
) as location
```

- Remove `plants.location` from all SELECT, INSERT, UPDATE queries

## Controller (controller.go)

- Replace `WaterPlant`, `DeleteWatering`, `ToggleWatering`, `BulkWaterPlants`, `CreateLocationChange`, `GetJournalEntries`, `GetLastWateredDates`, `GetWateringHistoryByDateRange`
- Add `CreateEvent`, `GetEventHandler`, `DeleteEvent`, `ListEvents`, `GetEventsRange`, `GetLastEventDates`
- `CreateEvent` responds with `409 Conflict` + `UniqueConstraintError` on duplicate watering date

## Router (router.go)

**Remove these routes:**

```
POST /plants/:id/watering/:date
DELETE /plants/:id/watering/:date
POST /plants/:id/watering/toggle
POST /plants/:id/location
POST /journal/watering/bulk
POST /journal/last-watered
POST /journal/watering/range
GET  /plants/:id/journal
GET  /plants/:id/journal/calendar/:startdate/:enddate
```

**Add these routes:**

```
GET  /api/plants/:id/events                     — ListEvents
POST /api/plants/:id/events                     — CreateEvent
GET  /api/plants/:id/events/:eventId            — GetEventHandler
DELETE /api/plants/:id/events/:eventId          — DeleteEvent
GET  /api/plants/:id/events/calendar/:start/:end — GetCalendarEvents
POST /api/events/range                          — GetEventsRange
POST /api/plants/last-event                     — GetLastEventDates
```

## Frontend

**New file: `frontend/src/domain/plants/plant-event.ts`**
```typescript
export type PlantEventType = 'watering' | 'fertilizing' | 'repotting' | 'note' | 'location_change'

export interface WateringMetadata {
  amount?: string
  type?: 'rocio' | 'riego'
}
export interface LocationChangeMetadata {
  location: string
}
export type EventMetadata = WateringMetadata | LocationChangeMetadata | Record<string, never>

export interface PlantEvent {
  id: number
  plantId: number
  type: PlantEventType
  eventDate: Date      // parsed from YYYY-MM-DD string
  notes?: string
  metadata: EventMetadata
  images: string[]      // URLs only
}

export interface CalendarEntry {
  id: string            // strconv.FormatInt(eventId) — always numeric string
  date: string
  eventType: PlantEventType
}
```

**Remove:** `plant-journal.ts`, `location-change.ts`

**New file: `frontend/src/api/events.ts`** — all event hooks in one place.
Query key convention: `["events", plantId]` for per-plant lists, `["events", "range", ...]` for global queries.

- `usePlantEvents(plantId)` — `GET /api/plants/:id/events`, query key `["events", plantId]`
- `usePlantEvent(plantId, eventId)` — `GET /api/plants/:id/events/:eventId`, query key `["events", plantId, eventId]`
- `useCreateEvent(plantId)` — `POST /api/plants/:id/events`; invalidates `["events", plantId]`
- `useDeleteEvent(plantId)` — `DELETE /api/plants/:id/events/:eventId`; invalidates `["events", plantId]`
- `useCalendarEvents(plantId, start, end)` — `GET /api/plants/:id/events/calendar/:start/:end`; query key `["events", "calendar", plantId, start, end]`
- `useEventsRange(plantIds, start, end, eventType?)` — `POST /api/events/range`; query key `["events", "range", ...plantIds, start, end, eventType]`
- `useLastEventDates(plantIds, eventType?)` — `POST /api/plants/last-event`; query key `["events", "last-dates", ...plantIds, eventType]`

**Remove:** `journal.ts`, `location-change.ts`, most of `watering.ts`

**Update:** `plants.ts` — remove `useCreateLocationChange`. Keep `location` in `toDomain` mapping (API still returns it via COALESCE subquery — no frontend change needed).

**Update:** `plant.ts` domain — keep `location` on `PlantWithDefinition`. It is still returned by the API (computed from latest `location_change` event). No type change needed.

**UI components:** Update data source imports from `plant-journal` to `plant-event`. Rendering logic stays the same (they already switch on type for styling).

## Execution Order

1. Types (`types.go`) — new structs, remove `JournalEntryType`, `PlantJournalEntry`, `PlantLocationHistoryEntry`, etc.
2. Schema + migration (`schema.sql`, `database.go`) — create tables, wrap in transaction
3. Store (`store.go`, `interfaces.go`) — new queries (`CreateEvent`, `GetEvent`, `GetEvents`, `GetEventsByDateRange`, `GetLastEventDates`, `GetCalendarEvents`, `DeleteEvent`), batch image loading
4. Service (`service.go`) — new methods (`CreateEvent`, `GetEvent`, `ListEvents`, `DeleteEvent`, `GetEventsRange`, `GetLastEventDates`, `GetCalendarEvents`), remove old ones, add `validateEventMetadata`, update `CreatePlant`/`UpdatePlant`
5. Controller (`controller.go`) — new handlers (`CreateEvent`, `GetEventHandler`, `DeleteEvent`, `ListEvents`, `GetEventsRange`, `GetLastEventDates`)
6. Router (`router.go`) — new routes, remove old ones
7. Frontend domain types (`plant-event.ts`)
8. Frontend API hooks (`events.ts`)
9. Frontend remove old files (`plant-journal.ts`, `location-change.ts`, `journal.ts`) + update imports
10. Test: run backend, verify timeline, calendar, location resolution
