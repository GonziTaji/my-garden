package plantevents

import "encoding/json"

type EventType string

const (
	EventTypeWatering       EventType = "watering"
	EventTypeFertilizing    EventType = "fertilizing"
	EventTypeRepotting      EventType = "repotting"
	EventTypeNote           EventType = "note"
	EventTypeLocationChange EventType = "location_change"
)

type WateringMetadata struct {
	Amount string `json:"amount,omitempty"`
	Type   string `json:"type,omitempty"`
}

type LocationChangeMetadata struct {
	Location string `json:"location"`
}

type PlantEvent struct {
	ID        int64           `json:"id"`
	PlantID   int64           `json:"plant_id"`
	EventType EventType       `json:"event_type"`
	EventDate string          `json:"event_date"`
	Notes     string          `json:"notes"`
	Metadata  json.RawMessage `json:"metadata"`
	Images    []string        `json:"images"`
	CreatedAt string          `json:"created_at"`
	UserID    int64           `json:"user_id"`
}

type CalendarEntry struct {
	ID        string    `json:"id"`
	Date      string    `json:"date"`
	EventType EventType `json:"eventType"`
}

type EnumOption struct {
	Key   string `json:"key"`
	Label string `json:"label"`
}

var EventTypes = []EnumOption{
	{"watering", "Watering"},
	{"fertilizing", "Fertilizing"},
	{"repotting", "Repotting"},
	{"note", "Note"},
	{"location_change", "Location change"},
}
