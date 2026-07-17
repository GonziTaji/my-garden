package plants

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"my-garden/internal/domain/plantevents"
)

type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}

type CreatePlantInput struct {
	Nickname       string    `json:"nickname"`
	Source         *string   `json:"source"`
	PlantSpeciesID int64     `json:"plant_species_id"`
	AcquiredAt     *string   `json:"acquired_at"`
	Images         *[]string `json:"images"`
	Location       *string   `json:"location"`
	Notes          *string   `json:"notes"`
}

type UpdatePlantInput struct {
	Nickname   *string `json:"nickname"`
	Source     *string `json:"source"`
	AcquiredAt *string `json:"acquired_at"`
	Notes      *string `json:"notes"`
}

type Service struct {
	store         StoreInterface
	speciesStore  PlantSpeciesStore
	eventStore    EventStore
}

func NewService(store StoreInterface, speciesStore PlantSpeciesStore, eventStore EventStore) *Service {
	return &Service{store: store, speciesStore: speciesStore, eventStore: eventStore}
}

func (s *Service) CreatePlant(input CreatePlantInput, userID int64) (*PlantWithSpecies, error) {
	nickname := strings.TrimSpace(input.Nickname)
	if nickname == "" {
		return nil, &ValidationError{Field: "nickname", Message: "El nombre de la planta es requerido"}
	}

	exists, err := s.speciesStore.ExistsPlantSpecies(input.PlantSpeciesID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, &ValidationError{Field: "plant_species_id", Message: "El tipo de planta seleccionado no existe"}
	}

	plant := &Plant{
		Nickname:       nickname,
		PlantSpeciesID: input.PlantSpeciesID,
		UserID:         userID,
	}
	if input.Source != nil {
		plant.Source = NullString{sql.NullString{String: *input.Source, Valid: true}}
	}
	if input.AcquiredAt != nil {
		plant.AcquiredAt = NullString{sql.NullString{String: *input.AcquiredAt, Valid: true}}
	}
	if input.Notes != nil {
		plant.Notes = NullString{sql.NullString{String: *input.Notes, Valid: true}}
	}

	id, err := s.store.CreatePlant(plant)
	if err != nil {
		return nil, fmt.Errorf("create plant: %w", err)
	}

	if input.Images != nil {
		for _, filepath := range *input.Images {
			if _, err := s.store.CreatePlantImage(id, filepath); err != nil {
				return nil, fmt.Errorf("create plant image: %w", err)
			}
		}
	}

	if input.Location != nil && *input.Location != "" {
		eventDate := ""
		if input.AcquiredAt != nil {
			eventDate = *input.AcquiredAt
		} else {
			eventDate = time.Now().Format("2006-01-02")
		}
		meta, _ := json.Marshal(struct {
			Location string `json:"location"`
		}{Location: *input.Location})
		_, err = s.eventStore.CreateEvent(&plantevents.PlantEvent{
			PlantID:   id,
			EventType: plantevents.EventTypeLocationChange,
			EventDate: eventDate,
			Notes:     "Initial location",
			Metadata:  meta,
			UserID:    userID,
		})
		if err != nil {
			return nil, fmt.Errorf("create initial location event: %w", err)
		}
	}

	return s.store.GetPlantWithSpecies(id, userID)
}

func (s *Service) GetPlant(id int64, userID int64) (*PlantWithSpecies, error) {
	p, err := s.store.GetPlantWithSpecies(id, userID)
	if err != nil {
		return nil, err
	}
	if p == nil {
		return nil, &ValidationError{Field: "id", Message: "Planta no encontrada"}
	}
	return p, nil
}

func (s *Service) ListPlants(speciesID *int64, userID int64) ([]PlantWithSpecies, error) {
	return s.store.ListPlantsWithSpecies(speciesID, userID)
}

func (s *Service) UpdatePlant(id int64, input UpdatePlantInput, userID int64) (*PlantWithSpecies, error) {
	existing, err := s.store.GetPlant(id, userID)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, &ValidationError{Field: "id", Message: "Planta no encontrada"}
	}

	if input.Nickname != nil {
		nickname := strings.TrimSpace(*input.Nickname)
		if nickname == "" {
			return nil, &ValidationError{Field: "nickname", Message: "El nombre de la planta es requerido"}
		}
		existing.Nickname = nickname
	}
	if input.Source != nil {
		existing.Source = NewNullString(*input.Source)
	}
	if input.AcquiredAt != nil {
		existing.AcquiredAt = NewNullString(*input.AcquiredAt)
	}
	if input.Notes != nil {
		existing.Notes = NewNullString(*input.Notes)
	}

	if err := s.store.UpdatePlant(existing); err != nil {
		return nil, fmt.Errorf("update plant: %w", err)
	}

	return s.store.GetPlantWithSpecies(id, userID)
}

func (s *Service) DeletePlant(id int64, userID int64) error {
	exists, err := s.store.GetPlant(id, userID)
	if err != nil {
		return err
	}
	if exists == nil {
		return &ValidationError{Field: "id", Message: "Planta no encontrada"}
	}
	return s.store.DeletePlant(id, userID)
}
