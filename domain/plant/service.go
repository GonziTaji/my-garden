package plant

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"slices"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Service struct {
	store StoreInterface
}

func NewService(store StoreInterface) *Service {
	return &Service{store: store}
}

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

const uploadsDir = "public/uploads/plant-species"
const plantUploadsDir = "public/uploads/plants"
const maxImageSize = 28 * 1024 * 1024

var allowedMIMETypes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/webp": true,
}

var allowedExtensions = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".webp": true,
}

// Species input

type UpsertSpeciesInput struct {
	CommonName       string              `json:"common_name"`
	ScientificName   string              `json:"scientific_name"`
	WaterProfile     string              `json:"water_profile"`
	LightLevel       string              `json:"light_level"`
	SoilType         string              `json:"soil_type"`
	PetToxicity      string              `json:"pet_toxicity"`
	PetToxicityNotes string              `json:"pet_toxicity_notes"`
	Categories       []string            `json:"categories"`
	Notes            *string             `json:"notes"`
	Images           []SpeciesImageInput `json:"images"`
	IsQuick          bool                `json:"is_quick"`
}

type SpeciesImageInput struct {
	Filepath string `json:"filepath"`
	Position int    `json:"position"`
}

// Validate and create

func (s *Service) CreateSpecies(input UpsertSpeciesInput, userID int64) (*PlantSpecies, error) {
	validated, err := validateUpsert(input, input.IsQuick)
	if err != nil {
		return nil, err
	}

	validated.UserID = userID
	validated.Visibility = "public"
	validated.IsQuick = input.IsQuick

	id, err := s.store.CreatePlantSpecies(validated)
	if err != nil {
		return nil, fmt.Errorf("create species: %w", err)
	}

	validated.ID = id
	return s.store.GetPlantSpecies(id, userID)
}

func (s *Service) UpdateSpecies(id int64, input UpsertSpeciesInput, userID int64) (*PlantSpecies, error) {
	existing, err := s.store.GetPlantSpecies(id, userID)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, &ValidationError{Field: "id", Message: "Tipo de planta no encontrado"}
	}
	if existing.UserID != userID {
		return nil, &ValidationError{Field: "id", Message: "No tienes permiso para editar este tipo de planta"}
	}

	validated, err := validateUpsert(input, false)
	if err != nil {
		return nil, err
	}

	oldFilepaths, err := s.store.GetSpeciesImageFilepaths(id)
	if err != nil {
		return nil, err
	}

	validated.ID = id
	validated.UserID = userID
	validated.Visibility = existing.Visibility
	if err := s.store.UpdatePlantSpecies(validated); err != nil {
		return nil, fmt.Errorf("update species: %w", err)
	}

	go cleanupOrphanedFiles(s.store, oldFilepaths)

	return s.store.GetPlantSpecies(id, userID)
}

func (s *Service) GetSpecies(id int64, userID int64) (*PlantSpecies, error) {
	sp, err := s.store.GetPlantSpecies(id, userID)
	if err != nil {
		return nil, err
	}
	if sp == nil {
		return nil, &ValidationError{Field: "id", Message: "Tipo de planta no encontrado"}
	}
	return sp, nil
}

func (s *Service) ListSpecies(userID int64, scope string) ([]PlantSpecies, error) {
	return s.store.ListPlantSpecies(userID, scope)
}

func (s *Service) DeleteSpecies(id int64, userID int64) error {
	existing, err := s.store.GetPlantSpecies(id, userID)
	if err != nil {
		return err
	}
	if existing == nil {
		return &ValidationError{Field: "id", Message: "Tipo de planta no encontrado"}
	}
	if existing.UserID != userID {
		return &ValidationError{Field: "id", Message: "No tienes permiso para eliminar este tipo de planta"}
	}

	if err := s.store.DeletePlantSpecies(id, userID); err != nil {
		return err
	}

	return nil
}

func (s *Service) ToggleFavorite(speciesID int64, userID int64) (bool, error) {
	return s.store.ToggleFavorite(userID, speciesID)
}

// Image upload

type UploadResult struct {
	Filepath string `json:"filepath"`
}

func (s *Service) AddPlantImage(plantID int64, file *multipart.FileHeader, userID int64) (*PlantImage, error) {
	result, err := s.UploadPlantImage(file)
	if err != nil {
		return nil, err
	}

	id, err := s.store.CreatePlantImage(plantID, result.Filepath)
	if err != nil {
		return nil, fmt.Errorf("create plant image: %w", err)
	}

	images, err := s.store.GetPlantImages(plantID)
	if err != nil {
		return nil, err
	}

	for i := range images {
		if images[i].ID == id {
			images[i].UserID = userID
			return &images[i], nil
		}
	}
	return nil, fmt.Errorf("plant image not found after creation")
}

func (s *Service) DeletePlantImage(imageID int64) error {
	return s.store.DeletePlantImage(imageID)
}

func (s *Service) UploadPlantImage(file *multipart.FileHeader) (*UploadResult, error) {
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedExtensions[ext] {
		return nil, &ValidationError{
			Field:   "file",
			Message: "Extension de imagen no permitida (usar .jpg, .jpeg, .png o .webp)",
		}
	}

	if file.Size > maxImageSize {
		return nil, &ValidationError{
			Field:   "file",
			Message: "Cada imagen debe pesar maximo 8MB",
		}
	}

	src, err := file.Open()
	if err != nil {
		return nil, fmt.Errorf("open uploaded file: %w", err)
	}
	defer src.Close()

	buf := make([]byte, 512)
	n, _ := io.ReadFull(src, buf)
	mimeType := http.DetectContentType(buf[:n])

	if !strings.HasPrefix(mimeType, "image/") {
		return nil, &ValidationError{
			Field:   "file",
			Message: "Solo se permiten archivos de imagen",
		}
	}
	if !allowedMIMETypes[mimeType] {
		return nil, &ValidationError{
			Field:   "file",
			Message: "Formato de imagen no permitido (usar JPG, PNG o WEBP)",
		}
	}

	if err := os.MkdirAll(plantUploadsDir, 0755); err != nil {
		return nil, fmt.Errorf("create uploads dir: %w", err)
	}

	filename := fmt.Sprintf("%d-%s%s", time.Now().UnixMilli(), uuid.New().String(), ext)
	targetPath := filepath.Join(plantUploadsDir, filename)

	out, err := os.Create(targetPath)
	if err != nil {
		return nil, fmt.Errorf("create file: %w", err)
	}
	defer out.Close()

	src.Seek(0, io.SeekStart)
	if _, err := io.Copy(out, src); err != nil {
		return nil, fmt.Errorf("write file: %w", err)
	}

	publicPath := path.Join("/uploads/plants", filename)
	return &UploadResult{Filepath: publicPath}, nil
}

func (s *Service) UploadImage(file *multipart.FileHeader) (*UploadResult, error) {
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedExtensions[ext] {
		return nil, &ValidationError{
			Field:   "file",
			Message: "Extension de imagen no permitida (usar .jpg, .jpeg, .png o .webp)",
		}
	}

	if file.Size > maxImageSize {
		return nil, &ValidationError{
			Field:   "file",
			Message: "Cada imagen debe pesar maximo 8MB",
		}
	}

	// Read first 512 bytes to detect MIME type
	src, err := file.Open()
	if err != nil {
		return nil, fmt.Errorf("open uploaded file: %w", err)
	}
	defer src.Close()

	buf := make([]byte, 512)
	n, _ := io.ReadFull(src, buf)
	mimeType := http.DetectContentType(buf[:n])

	if !strings.HasPrefix(mimeType, "image/") {
		return nil, &ValidationError{
			Field:   "file",
			Message: "Solo se permiten archivos de imagen",
		}
	}
	if !allowedMIMETypes[mimeType] {
		return nil, &ValidationError{
			Field:   "file",
			Message: "Formato de imagen no permitido (usar JPG, PNG o WEBP)",
		}
	}

	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		return nil, fmt.Errorf("create uploads dir: %w", err)
	}

	filename := fmt.Sprintf("%d-%s%s", time.Now().UnixMilli(), uuid.New().String(), ext)
	targetPath := filepath.Join(uploadsDir, filename)

	out, err := os.Create(targetPath)
	if err != nil {
		return nil, fmt.Errorf("create file: %w", err)
	}
	defer out.Close()

	src.Seek(0, io.SeekStart)
	if _, err := io.Copy(out, src); err != nil {
		return nil, fmt.Errorf("write file: %w", err)
	}

	publicPath := path.Join("/uploads/plant-species", filename)
	return &UploadResult{Filepath: publicPath}, nil
}

// Plants

type CreatePlantInput struct {
	Nickname       string  `json:"nickname"`
	Source         *string `json:"source"`
	PlantSpeciesID int64   `json:"plant_species_id"`
	AcquiredAt     *string `json:"acquired_at"`
	Location       *string `json:"location"`
	Notes          *string `json:"notes"`
}

func (s *Service) CreatePlant(input CreatePlantInput, userID int64) (*PlantWithSpecies, error) {
	nickname := strings.TrimSpace(input.Nickname)
	if nickname == "" {
		return nil, &ValidationError{Field: "nickname", Message: "El nombre de la planta es requerido"}
	}

	exists, err := s.store.ExistsPlantSpecies(input.PlantSpeciesID)
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

	if input.Location != nil && *input.Location != "" {
		eventDate := ""
		if input.AcquiredAt != nil {
			eventDate = *input.AcquiredAt
		} else {
			eventDate = time.Now().Format("2006-01-02")
		}
		meta, _ := json.Marshal(LocationChangeMetadata{Location: *input.Location})
		_, err = s.store.CreateEvent(&PlantEvent{
			PlantID:   id,
			EventType: EventTypeLocationChange,
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

type UpdatePlantInput struct {
	Nickname   *string `json:"nickname"`
	Source     *string `json:"source"`
	AcquiredAt *string `json:"acquired_at"`
	Notes      *string `json:"notes"`
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

// Events

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

// Internal helpers

func validateUpsert(input UpsertSpeciesInput, isQuick bool) (*PlantSpecies, error) {
	sp := &PlantSpecies{}

	sp.CommonName = strings.TrimSpace(input.CommonName)
	if sp.CommonName == "" {
		return nil, &ValidationError{Field: "common_name", Message: "El nombre comun es requerido"}
	}

	sp.ScientificName = strings.TrimSpace(input.ScientificName)

	sp.WaterProfile = WaterProfile(input.WaterProfile)
	if !isValidEnum(string(sp.WaterProfile), validWaterProfiles) {
		return nil, &ValidationError{Field: "water_profile", Message: "Perfil de agua invalido"}
	}

	if isQuick {
		if input.LightLevel != "" {
			sp.LightLevel = LightLevel(input.LightLevel)
			if !isValidEnum(string(sp.LightLevel), validLightLevels) {
				return nil, &ValidationError{Field: "light_level", Message: "Nivel de luz invalido"}
			}
		} else {
			sp.LightLevel = LightLevelIndirect
		}
		if input.SoilType != "" {
			sp.SoilType = SoilType(input.SoilType)
			if !isValidEnum(string(sp.SoilType), validSoilTypes) {
				return nil, &ValidationError{Field: "soil_type", Message: "Tipo de suelo invalido"}
			}
		} else {
			sp.SoilType = SoilTypeWellDraining
		}
		if input.PetToxicity != "" {
			sp.PetToxicity = PetToxicity(input.PetToxicity)
			if !isValidEnum(string(sp.PetToxicity), validPetToxicities) {
				return nil, &ValidationError{Field: "pet_toxicity", Message: "Toxicidad invalida"}
			}
		} else {
			sp.PetToxicity = PetToxicityNonToxic
		}
	} else {
		sp.LightLevel = LightLevel(input.LightLevel)
		if !isValidEnum(string(sp.LightLevel), validLightLevels) {
			return nil, &ValidationError{Field: "light_level", Message: "Nivel de luz invalido"}
		}
		sp.SoilType = SoilType(input.SoilType)
		if !isValidEnum(string(sp.SoilType), validSoilTypes) {
			return nil, &ValidationError{Field: "soil_type", Message: "Tipo de suelo invalido"}
		}
		sp.PetToxicity = PetToxicity(input.PetToxicity)
		if !isValidEnum(string(sp.PetToxicity), validPetToxicities) {
			return nil, &ValidationError{Field: "pet_toxicity", Message: "Toxicidad invalida"}
		}
	}

	sp.PetToxicityNotes = input.PetToxicityNotes

	if input.Notes != nil {
		sp.Notes = *input.Notes
	}

	if input.Categories == nil {
		input.Categories = []string{}
	}

	for _, cat := range input.Categories {
		if !isValidEnum(cat, validPlantCategories) {
			return nil, &ValidationError{Field: "categories", Message: fmt.Sprintf("Categoria invalida: %s", cat)}
		}
	}

	catsJSON, err := json.Marshal(input.Categories)
	if err != nil {
		return nil, fmt.Errorf("marshal categories: %w", err)
	}
	sp.CategoriesJSON = string(catsJSON)

	if len(input.Images) > 3 {
		return nil, &ValidationError{Field: "images", Message: "No se pueden guardar mas de 3 imagenes"}
	}

	seen := make(map[int]bool)
	for _, img := range input.Images {
		if img.Position < 0 || img.Position > 2 {
			return nil, &ValidationError{Field: "images", Message: "Posicion de imagen invalida"}
		}
		if seen[img.Position] {
			return nil, &ValidationError{Field: "images", Message: "Posiciones de imagen duplicadas"}
		}
		seen[img.Position] = true
		if strings.TrimSpace(img.Filepath) == "" {
			return nil, &ValidationError{Field: "images", Message: "Filepath de imagen vacio"}
		}
		sp.Images = append(sp.Images, PlantSpeciesImage{
			Filepath: strings.TrimSpace(img.Filepath),
			Position: img.Position,
		})
	}

	return sp, nil
}

func isValidEnum(value string, valid []string) bool {
	return slices.Contains(valid, value)
}

var validWaterProfiles = []string{"dry_cycle", "semi_dry_cycle", "even_moisture", "wet"}
var validLightLevels = []string{"low", "indirect", "bright_indirect", "direct"}
var validSoilTypes = []string{"aerated", "well_draining", "moisture_retentive"}
var validPetToxicities = []string{"beneficial", "non_toxic", "lightly_toxic", "highly_toxic"}
var validPlantCategories = []string{
	"cactus_succulent", "fern", "mediterranean", "creeper",
	"tree", "tropical", "climber",
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

func cleanupOrphanedFiles(store StoreInterface, oldFilepaths []string) {
	for _, fp := range oldFilepaths {
		count, err := store.CountImageReferences(fp)
		if err != nil || count > 0 {
			continue
		}

		relativePath := strings.TrimPrefix(fp, "/")
		absPath := filepath.Join(relativePath)

		os.Remove(absPath)
	}
}
