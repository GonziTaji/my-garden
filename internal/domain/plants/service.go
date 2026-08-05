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
	Nickname       *string   `json:"nickname"`
	Source         *string   `json:"source"`
	AcquiredAt     *string   `json:"acquired_at"`
	Notes          *string   `json:"notes"`
	PlantSpeciesID *int64    `json:"plant_species_id"`
	Location       *string   `json:"location"`
	Images         *[]string `json:"images"`
}

type Service struct {
	store        StoreInterface
	speciesStore PlantSpeciesStore
	eventStore   EventStore
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
	plants, err := s.store.ListPlantsWithSpecies(speciesID, userID)
	if err != nil {
		return nil, err
	}

	speciesImageCache := make(map[int64]string)
	for i := range plants {
		if len(plants[i].Images) > 0 {
			continue
		}
		speciesID := plants[i].PlantSpecies.ID
		if filepath, ok := speciesImageCache[speciesID]; ok {
			if filepath != "" {
				plants[i].Images = []PlantImage{{PlantID: plants[i].ID, Filepath: filepath}}
			}
			continue
		}
		filepaths, err := s.speciesStore.GetSpeciesImageFilepaths(speciesID)
		if err != nil {
			return nil, fmt.Errorf("get species images: %w", err)
		}
		if len(filepaths) > 0 {
			speciesImageCache[speciesID] = filepaths[0]
			plants[i].Images = []PlantImage{{PlantID: plants[i].ID, Filepath: filepaths[0]}}
		} else {
			speciesImageCache[speciesID] = ""
		}
	}

	return plants, nil
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
	if input.PlantSpeciesID != nil {
		exists, err := s.speciesStore.ExistsPlantSpecies(*input.PlantSpeciesID)
		if err != nil {
			return nil, err
		}
		if !exists {
			return nil, &ValidationError{Field: "plant_species_id", Message: "El tipo de planta seleccionado no existe"}
		}
		existing.PlantSpeciesID = *input.PlantSpeciesID
	}

	if err := s.store.UpdatePlant(existing); err != nil {
		return nil, fmt.Errorf("update plant: %w", err)
	}

	if input.Location != nil && *input.Location != "" {
		eventDate := time.Now().Format("2006-01-02")
		if input.AcquiredAt != nil {
			eventDate = *input.AcquiredAt
		}
		meta, _ := json.Marshal(struct {
			Location string `json:"location"`
		}{Location: *input.Location})
		_, err := s.eventStore.CreateEvent(&plantevents.PlantEvent{
			PlantID:   id,
			EventType: plantevents.EventTypeLocationChange,
			EventDate: eventDate,
			Notes:     "Location update",
			Metadata:  meta,
			UserID:    userID,
		})
		if err != nil {
			return nil, fmt.Errorf("create location event: %w", err)
		}
	}

	if input.Images != nil {
		desired := make(map[string]struct{}, len(*input.Images))
		for _, filepath := range *input.Images {
			desired[filepath] = struct{}{}
		}

		existingImages, err := s.store.GetPlantImages(id)
		if err != nil {
			return nil, fmt.Errorf("get plant images: %w", err)
		}

		existingPaths := make(map[string]struct{}, len(existingImages))
		for _, img := range existingImages {
			existingPaths[img.Filepath] = struct{}{}
			if _, ok := desired[img.Filepath]; !ok {
				if err := s.store.DeletePlantImage(img.ID); err != nil {
					return nil, fmt.Errorf("delete plant image: %w", err)
				}
			}
		}

		for _, filepath := range *input.Images {
			if _, ok := existingPaths[filepath]; ok {
				continue
			}
			if _, err := s.store.CreatePlantImage(id, filepath); err != nil {
				return nil, fmt.Errorf("create plant image: %w", err)
			}
		}
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
