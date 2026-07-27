package plantevents

import (
	"database/sql"
	"encoding/json"
	"fmt"
)

type Store struct {
	db *sql.DB
}

func NewStore(db *sql.DB) *Store {
	return &Store{db: db}
}

func (s *Store) CreateEvent(e *PlantEvent) (int64, error) {
	result, err := s.db.Exec(`
		insert into plant_events
			(plant_id, event_type, event_date, notes, metadata, user_id)
		values (?, ?, ?, ?, ?, ?)
	`, e.PlantID, e.EventType, e.EventDate, e.Notes, string(e.Metadata), e.UserID)
	if err != nil {
		return 0, fmt.Errorf("create event: %w", err)
	}
	return result.LastInsertId()
}

func (s *Store) GetEvent(eventID int64) (*PlantEvent, error) {
	row := s.db.QueryRow(`
		select id, plant_id, event_type, event_date, notes, metadata, created_at, user_id
		from plant_events
		where id = ?
	`, eventID)

	var e PlantEvent
	var metadataStr string
	err := row.Scan(&e.ID, &e.PlantID, &e.EventType, &e.EventDate, &e.Notes,
		&metadataStr, &e.CreatedAt, &e.UserID)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get event: %w", err)
	}
	e.Metadata = json.RawMessage(metadataStr)
	return &e, nil
}

func (s *Store) DeleteEvent(id int64) error {
	_, err := s.db.Exec("delete from plant_events where id = ?", id)
	if err != nil {
		return fmt.Errorf("delete event: %w", err)
	}
	return nil
}

func (s *Store) GetEvents(plantID int64) ([]PlantEvent, error) {
	rows, err := s.db.Query(`
		select id, plant_id, event_type, event_date, notes, metadata, created_at, user_id
		from plant_events
		where plant_id = ?
		order by event_date desc, id desc
	`, plantID)
	if err != nil {
		return nil, fmt.Errorf("get events: %w", err)
	}
	defer rows.Close()

	events := make([]PlantEvent, 0)
	for rows.Next() {
		var e PlantEvent
		var metadataStr string
		err := rows.Scan(&e.ID, &e.PlantID, &e.EventType, &e.EventDate, &e.Notes,
			&metadataStr, &e.CreatedAt, &e.UserID)
		if err != nil {
			return nil, fmt.Errorf("scan event: %w", err)
		}
		e.Metadata = json.RawMessage(metadataStr)
		events = append(events, e)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration: %w", err)
	}

	// batch load images
	s.loadEventImages(events)

	return events, nil
}

func (s *Store) loadEventImages(events []PlantEvent) {
	if len(events) == 0 {
		return
	}
	ids := make([]int64, len(events))
	idIndex := make(map[int64]int, len(events))
	for i, e := range events {
		ids[i] = e.ID
		idIndex[e.ID] = i
	}

	rows, err := s.db.Query(`
		select plant_event_id, url from plant_event_images
		where plant_event_id in (`+placeholders(len(ids))+`)
		order by plant_event_id asc, id asc
	`, int64sToAny(ids)...)
	if err != nil {
		return
	}
	defer rows.Close()

	for rows.Next() {
		var eventID int64
		var url string
		if err := rows.Scan(&eventID, &url); err != nil {
			continue
		}
		if idx, ok := idIndex[eventID]; ok {
			events[idx].Images = append(events[idx].Images, url)
		}
	}
}

func (s *Store) GetEventsByDateRange(plantIDs []int64, start, end string, eventType *string) ([]PlantEvent, error) {
	query := `select id, plant_id, event_type, event_date, notes, metadata, created_at, user_id
		from plant_events
		where plant_id in (` + placeholders(len(plantIDs)) + `)
			and event_date >= ? and event_date <= ?`
	args := make([]any, 0, len(plantIDs)+2)
	for _, id := range plantIDs {
		args = append(args, id)
	}
	args = append(args, start, end)

	if eventType != nil {
		query += ` and event_type = ?`
		args = append(args, *eventType)
	}
	query += ` order by plant_id, event_date desc`

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("get events by date range: %w", err)
	}
	defer rows.Close()

	events := make([]PlantEvent, 0)
	for rows.Next() {
		var e PlantEvent
		var metadataStr string
		err := rows.Scan(&e.ID, &e.PlantID, &e.EventType, &e.EventDate, &e.Notes,
			&metadataStr, &e.CreatedAt, &e.UserID)
		if err != nil {
			return nil, fmt.Errorf("scan event: %w", err)
		}
		e.Metadata = json.RawMessage(metadataStr)
		events = append(events, e)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration: %w", err)
	}

	return events, nil
}

func (s *Store) GetLastEventDates(plantIDs []int64, eventType *string) (map[int64]*string, error) {
	query := `select p.id, max(e.event_date) as last_date
		from plants p
		left join plant_events e on e.plant_id = p.id`
	args := make([]any, 0, len(plantIDs)+1)

	if eventType != nil {
		query += ` and e.event_type = ?`
		args = append(args, *eventType)
	}

	query += ` where p.id in (` + placeholders(len(plantIDs)) + `)
		group by p.id`
	args = append(args, int64sToAny(plantIDs)...)

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("get last event dates: %w", err)
	}
	defer rows.Close()

	result := make(map[int64]*string)
	for rows.Next() {
		var plantID int64
		var lastDate sql.NullString
		if err := rows.Scan(&plantID, &lastDate); err != nil {
			return nil, fmt.Errorf("scan last event date: %w", err)
		}
		if lastDate.Valid {
			result[plantID] = &lastDate.String
		} else {
			result[plantID] = nil
		}
	}
	return result, nil
}

func (s *Store) GetCalendarEvents(plantID int64, start, end string) ([]CalendarEntry, error) {
	rows, err := s.db.Query(`
		select id, event_type, event_date
		from plant_events
		where plant_id = ? and event_date >= ? and event_date <= ?
		order by event_date desc
	`, plantID, start, end)
	if err != nil {
		return nil, fmt.Errorf("get calendar events: %w", err)
	}
	defer rows.Close()

	entries := make([]CalendarEntry, 0)
	for rows.Next() {
		var entry CalendarEntry
		var id int64
		if err := rows.Scan(&id, &entry.EventType, &entry.Date); err != nil {
			return nil, fmt.Errorf("scan calendar entry: %w", err)
		}
		entry.ID = fmt.Sprintf("%d", id)
		entries = append(entries, entry)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration: %w", err)
	}
	return entries, nil
}

func placeholders(n int) string {
	if n == 0 {
		return "select null where false"
	}
	b := make([]byte, 0, n*2-1)
	for i := range n {
		if i > 0 {
			b = append(b, ',')
		}
		b = append(b, '?')
	}
	return string(b)
}

func int64sToAny(ids []int64) []any {
	result := make([]any, len(ids))
	for i, id := range ids {
		result[i] = id
	}
	return result
}
