package plantevents

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}

type UniqueConstraintError struct {
	Field   string
	Message string
}

func (e *UniqueConstraintError) Error() string {
	return e.Message
}

type CreateEventInput struct {
	EventType string          `json:"event_type"`
	EventDate string          `json:"event_date"`
	Notes     *string         `json:"notes"`
	Metadata  json.RawMessage `json:"metadata"`
}

type EventsRangeInput struct {
	PlantIDs  []int64 `json:"plant_ids"`
	StartDate string  `json:"start_date"`
	EndDate   string  `json:"end_date"`
	EventType *string `json:"event_type,omitempty"`
}

type Service struct {
	store StoreInterface
}

func NewService(store StoreInterface) *Service {
	return &Service{store: store}
}

func (s *Service) CreateEvent(input CreateEventInput, plantID int64, userID int64) (*PlantEvent, error) {
	if _, err := time.Parse("2006-01-02", input.EventDate); err != nil {
		return nil, &ValidationError{Field: "event_date", Message: "La fecha debe tener formato YYYY-MM-DD"}
	}

	eventType := EventType(input.EventType)
	switch eventType {
	case EventTypeWatering, EventTypeFertilizing, EventTypeRepotting, EventTypeNote, EventTypeLocationChange:
	default:
		return nil, &ValidationError{Field: "event_type", Message: "Tipo de evento invalido"}
	}

	if err := validateEventMetadata(eventType, input.Metadata); err != nil {
		return nil, err
	}

	notes := ""
	if input.Notes != nil {
		notes = *input.Notes
	}

	metadata := input.Metadata
	if metadata == nil {
		metadata = json.RawMessage("{}")
	}

	id, err := s.store.CreateEvent(&PlantEvent{
		PlantID:   plantID,
		EventType: eventType,
		EventDate: input.EventDate,
		Notes:     notes,
		Metadata:  metadata,
		UserID:    userID,
	})
	if err != nil {
		if isUniqueConstraintErr(err) {
			return nil, &UniqueConstraintError{
				Field:   "event_date",
				Message: "Ya existe un registro de riego para esta fecha",
			}
		}
		return nil, fmt.Errorf("create event: %w", err)
	}

	return s.store.GetEvent(id)
}

func (s *Service) GetEvent(id int64, userID int64) (*PlantEvent, error) {
	event, err := s.store.GetEvent(id)
	if err != nil {
		return nil, err
	}
	if event == nil {
		return nil, &ValidationError{Field: "id", Message: "Evento no encontrado"}
	}
	if event.UserID != userID {
		return nil, &ValidationError{Field: "id", Message: "No tienes permiso para ver este evento"}
	}
	return event, nil
}

func (s *Service) ListEvents(plantID int64, userID int64) ([]PlantEvent, error) {
	return s.store.GetEvents(plantID)
}

func (s *Service) DeleteEvent(id int64, userID int64) error {
	event, err := s.store.GetEvent(id)
	if err != nil {
		return err
	}
	if event == nil {
		return nil
	}
	if event.UserID != userID {
		return &ValidationError{Field: "id", Message: "No tienes permiso para eliminar este evento"}
	}
	return s.store.DeleteEvent(id)
}

func (s *Service) GetEventsRange(input EventsRangeInput, userID int64) ([]PlantEvent, error) {
	return s.store.GetEventsByDateRange(input.PlantIDs, input.StartDate, input.EndDate, input.EventType)
}

func (s *Service) GetLastEventDates(plantIDs []int64, eventType *string) (map[int64]*string, error) {
	return s.store.GetLastEventDates(plantIDs, eventType)
}

func (s *Service) GetCalendarEvents(plantID int64, start, end string, userID int64) ([]CalendarEntry, error) {
	return s.store.GetCalendarEvents(plantID, start, end)
}

func isUniqueConstraintErr(err error) bool {
	return strings.Contains(err.Error(), "UNIQUE constraint failed")
}

func validateEventMetadata(eventType EventType, raw json.RawMessage) error {
	if raw == nil || string(raw) == "" || string(raw) == "null" {
		return nil
	}
	switch eventType {
	case EventTypeWatering:
		var meta WateringMetadata
		if err := json.Unmarshal(raw, &meta); err != nil {
			return &ValidationError{Field: "metadata", Message: "Metadata de riego invalida"}
		}
		if meta.Type != "" && meta.Type != "rocio" && meta.Type != "riego" {
			return &ValidationError{Field: "metadata.type", Message: "Tipo de riego invalido (usar 'rocio' o 'riego')"}
		}
	case EventTypeLocationChange:
		var meta LocationChangeMetadata
		if err := json.Unmarshal(raw, &meta); err != nil {
			return &ValidationError{Field: "metadata", Message: "Metadata de cambio de ubicacion invalida"}
		}
		if meta.Location == "" {
			return &ValidationError{Field: "metadata.location", Message: "La ubicacion es requerida"}
		}
	}
	return nil
}
