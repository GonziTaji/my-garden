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

const uploadsDir = "public/uploads/plant-definitions"
const maxImageSize = 8 * 1024 * 1024

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

// Definition input

type UpsertDefinitionInput struct {
	CommonName       string                 `json:"common_name"`
	ScientificName   string                 `json:"scientific_name"`
	WaterProfile     string                 `json:"water_profile"`
	LightLevel       string                 `json:"light_level"`
	SoilType         string                 `json:"soil_type"`
	PetToxicity      string                 `json:"pet_toxicity"`
	PetToxicityNotes string                 `json:"pet_toxicity_notes"`
	Categories       []string               `json:"categories"`
	Images           []DefinitionImageInput `json:"images"`
}

type DefinitionImageInput struct {
	Filepath string `json:"filepath"`
	Position int    `json:"position"`
}

// Validate and create

func (s *Service) CreateDefinition(input UpsertDefinitionInput) (*PlantDefinition, error) {
	validated, err := validateUpsert(input)
	if err != nil {
		return nil, err
	}

	id, err := s.store.CreatePlantDefinition(validated)
	if err != nil {
		if isUniqueConstraintErr(err) {
			return nil, &UniqueConstraintError{
				Field:   "scientific_name",
				Message: "Ya existe un tipo de planta con ese nombre cientifico",
			}
		}
		return nil, fmt.Errorf("create definition: %w", err)
	}

	validated.ID = id
	return s.store.GetPlantDefinition(id)
}

func (s *Service) UpdateDefinition(id int64, input UpsertDefinitionInput) (*PlantDefinition, error) {
	exists, err := s.store.ExistsPlantDefinition(id)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, &ValidationError{Field: "id", Message: "Tipo de planta no encontrado"}
	}

	validated, err := validateUpsert(input)
	if err != nil {
		return nil, err
	}

	oldFilepaths, err := s.store.GetDefinitionImageFilepaths(id)
	if err != nil {
		return nil, err
	}

	validated.ID = id
	if err := s.store.UpdatePlantDefinition(validated); err != nil {
		if isUniqueConstraintErr(err) {
			return nil, &UniqueConstraintError{
				Field:   "scientific_name",
				Message: "Ya existe un tipo de planta con ese nombre cientifico",
			}
		}
		return nil, fmt.Errorf("update definition: %w", err)
	}

	go cleanupOrphanedFiles(s.store, oldFilepaths)

	return s.store.GetPlantDefinition(id)
}

func (s *Service) GetDefinition(id int64) (*PlantDefinition, error) {
	def, err := s.store.GetPlantDefinition(id)
	if err != nil {
		return nil, err
	}
	if def == nil {
		return nil, &ValidationError{Field: "id", Message: "Tipo de planta no encontrado"}
	}
	return def, nil
}

func (s *Service) ListDefinitions() ([]PlantDefinition, error) {
	return s.store.ListPlantDefinitions()
}

func (s *Service) DeleteDefinition(id int64) error {
	exists, err := s.store.ExistsPlantDefinition(id)
	if err != nil {
		return err
	}
	if !exists {
		return &ValidationError{Field: "id", Message: "Tipo de planta no encontrado"}
	}

	oldFilepaths, err := s.store.GetDefinitionImageFilepaths(id)
	if err != nil {
		return err
	}

	if err := s.store.DeletePlantDefinition(id); err != nil {
		return err
	}

	go cleanupOrphanedFiles(s.store, oldFilepaths)

	return nil
}

// Image upload

type UploadResult struct {
	Filepath string `json:"filepath"`
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

	publicPath := path.Join("/uploads/plant-definitions", filename)
	return &UploadResult{Filepath: publicPath}, nil
}

// Location History

type CreateLocationChangeInput struct {
	PlantID      int64   `json:"plant_id"`
	Location     string  `json:"location"`
	RegisteredAt *string `json:"registered_at"`
	Notes        *string `json:"notes"`
}

func (s *Service) CreateLocationChange(input CreateLocationChangeInput) (*PlantLocationHistoryEntry, error) {
	entry := &PlantLocationHistoryEntry{
		PlantID:  input.PlantID,
		Location: input.Location,
	}

	if input.RegisteredAt != nil {
		entry.RegisteredAt = *input.RegisteredAt
	} else {
		entry.RegisteredAt = time.Now().Format("2006-01-02 15:04:05")
	}

	if input.Notes != nil {
		entry.Notes = *input.Notes
	}

	id, err := s.store.CreatePlantLocationHistory(entry)
	if err != nil {
		return nil, fmt.Errorf("create location change: %w", err)
	}
	entry.ID = id
	return entry, nil
}

// Plants

type CreatePlantInput struct {
	Nickname          string  `json:"nickname"`
	Source            *string `json:"source"`
	PlantDefinitionID int64   `json:"plant_definition_id"`
	AcquiredAt        *string `json:"acquired_at"`
	Location          *string `json:"location"`
	Notes             *string `json:"notes"`
}

func (s *Service) CreatePlant(input CreatePlantInput) (*PlantWithDefinition, error) {
	nickname := strings.TrimSpace(input.Nickname)
	if nickname == "" {
		return nil, &ValidationError{Field: "nickname", Message: "El nombre de la planta es requerido"}
	}

	exists, err := s.store.ExistsPlantDefinition(input.PlantDefinitionID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, &ValidationError{Field: "plant_definition_id", Message: "El tipo de planta seleccionado no existe"}
	}

	plant := &Plant{
		Nickname:          nickname,
		PlantDefinitionID: input.PlantDefinitionID,
	}
	if input.Source != nil {
		plant.Source = NullString{sql.NullString{String: *input.Source, Valid: true}}
	}
	if input.AcquiredAt != nil {
		plant.AcquiredAt = NullString{sql.NullString{String: *input.AcquiredAt, Valid: true}}
	}
	if input.Location != nil {
		plant.Location = NullString{sql.NullString{String: *input.Location, Valid: true}}
	}
	if input.Notes != nil {
		plant.Notes = NullString{sql.NullString{String: *input.Notes, Valid: true}}
	}

	id, err := s.store.CreatePlant(plant)
	if err != nil {
		return nil, fmt.Errorf("create plant: %w", err)
	}

	if input.Location != nil && *input.Location != "" {
		regAt := ""
		if input.AcquiredAt != nil {
			regAt = *input.AcquiredAt
		} else {
			regAt = time.Now().Format("2006-01-02 15:04:05")
		}
		_, err = s.store.CreatePlantLocationHistory(&PlantLocationHistoryEntry{
			PlantID:      id,
			Location:     *input.Location,
			RegisteredAt: regAt,
			Notes:        "Initial location",
		})
		if err != nil {
			return nil, fmt.Errorf("create initial location history: %w", err)
		}
	}

	return s.store.GetPlantWithDefinition(id)
}

func (s *Service) GetPlant(id int64) (*PlantWithDefinition, error) {
	p, err := s.store.GetPlantWithDefinition(id)
	if err != nil {
		return nil, err
	}
	if p == nil {
		return nil, &ValidationError{Field: "id", Message: "Planta no encontrada"}
	}
	return p, nil
}

func (s *Service) ListPlants(definitionID *int64) ([]PlantWithDefinition, error) {
	return s.store.ListPlantsWithDefinition(definitionID)
}

type UpdatePlantInput struct {
	Nickname   *string `json:"nickname"`
	Source     *string `json:"source"`
	AcquiredAt *string `json:"acquired_at"`
	Notes      *string `json:"notes"`
}

func (s *Service) UpdatePlant(id int64, input UpdatePlantInput) (*PlantWithDefinition, error) {
	existing, err := s.store.GetPlant(id)
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

	return s.store.GetPlantWithDefinition(id)
}

func (s *Service) DeletePlant(id int64) error {
	exists, err := s.store.GetPlant(id)
	if err != nil {
		return err
	}
	if exists == nil {
		return &ValidationError{Field: "id", Message: "Planta no encontrada"}
	}
	return s.store.DeletePlant(id)
}

// Journal / Watering

type WateringToggleResult struct {
	Watered bool `json:"watered"`
}

func (s *Service) ToggleWatering(plantID int64, date string) (*WateringToggleResult, error) {
	existing, err := s.store.GetWateringEntry(plantID, date)
	if err != nil {
		return nil, err
	}

	if existing != nil {
		if err := s.store.DeleteJournalEntry(existing.ID); err != nil {
			return nil, err
		}
		return &WateringToggleResult{Watered: false}, nil
	}

	_, err = s.store.CreateJournalEntry(&PlantJournalEntry{
		PlantID:          plantID,
		JournalEntryType: JournalEntryTypeWatering,
		WateringDate:     date,
	})
	if err != nil {
		if isUniqueConstraintErr(err) {
			return &WateringToggleResult{Watered: true}, nil
		}
		return nil, err
	}
	return &WateringToggleResult{Watered: true}, nil
}

type WaterEntryInput struct {
	PlantID int64   `json:"plant_id"`
	Date    *string `json:"date"`
}

func (s *Service) WaterPlant(input WaterEntryInput) (*PlantJournalEntry, error) {
	date := input.Date

	if date == nil || *date == "" {
		return nil, fmt.Errorf("No valid date: %v", date)
	}

	existing, err := s.store.GetWateringEntry(input.PlantID, *date)
	if err != nil {
		return nil, err
	}

	if existing != nil {
		if err := s.store.DeleteJournalEntry(existing.ID); err != nil {
			return nil, err
		}
		return nil, nil
	}

	_, err = s.store.CreateJournalEntry(&PlantJournalEntry{
		PlantID:          input.PlantID,
		JournalEntryType: JournalEntryTypeWatering,
		WateringDate:     *date,
	})
	if err != nil {
		if isUniqueConstraintErr(err) {
			existing, err := s.store.GetWateringEntry(input.PlantID, *date)
			if err != nil {
				return nil, err
			}
			if existing != nil {
				if err := s.store.DeleteJournalEntry(existing.ID); err != nil {
					return nil, err
				}
			}
			return nil, nil
		}
		return nil, err
	}

	return s.store.GetWateringEntry(input.PlantID, *date)
}

type BulkWaterInput struct {
	PlantIDs []int64 `json:"plant_ids"`
}

func (s *Service) BulkWaterPlants(input BulkWaterInput) error {
	today := time.Now().Format("2006-01-02")
	for _, plantID := range input.PlantIDs {
		existing, err := s.store.GetWateringEntry(plantID, today)
		if err != nil {
			return err
		}
		if existing != nil {
			continue
		}

		_, err = s.store.CreateJournalEntry(&PlantJournalEntry{
			PlantID:          plantID,
			JournalEntryType: JournalEntryTypeWatering,
			WateringDate:     today,
		})
		if err != nil {
			if isUniqueConstraintErr(err) {
				continue
			}
			return err
		}
	}
	return nil
}

type DeleteWateringInput struct {
	PlantID int64  `json:"plant_id"`
	Date    string `json:"date"`
}

func (s *Service) DeleteWatering(input DeleteWateringInput) error {
	existing, err := s.store.GetWateringEntry(input.PlantID, input.Date)
	if err != nil {
		return err
	}
	if existing == nil {
		return nil
	}
	return s.store.DeleteJournalEntry(existing.ID)
}

type WateringRangeInput struct {
	PlantIDs  []int64 `json:"plant_ids"`
	StartDate string  `json:"start_date"`
	EndDate   string  `json:"end_date"`
}

func (s *Service) GetWateringHistoryByDateRange(input WateringRangeInput) ([]PlantJournalEntry, error) {
	return s.store.GetWateringHistoryByDateRange(input.PlantIDs, input.StartDate, input.EndDate)
}

func (s *Service) GetLastWateredDates(plantIDs []int64) (map[int64]*string, error) {
	return s.store.GetLastWateredDates(plantIDs)
}

func (s *Service) GetJournalEntries(plantID int64) ([]PlantJournalEntry, error) {
	return s.store.GetJournalEntries(plantID)
}

// Internal helpers

func validateUpsert(input UpsertDefinitionInput) (*PlantDefinition, error) {
	d := &PlantDefinition{}

	d.CommonName = strings.TrimSpace(input.CommonName)
	if d.CommonName == "" {
		return nil, &ValidationError{Field: "common_name", Message: "El nombre comun es requerido"}
	}

	d.ScientificName = strings.TrimSpace(input.ScientificName)
	if d.ScientificName == "" {
		return nil, &ValidationError{Field: "scientific_name", Message: "El nombre cientifico es requerido"}
	}

	d.WaterProfile = WaterProfile(input.WaterProfile)
	if !isValidEnum(string(d.WaterProfile), validWaterProfiles) {
		return nil, &ValidationError{Field: "water_profile", Message: "Perfil de agua invalido"}
	}

	d.LightLevel = LightLevel(input.LightLevel)
	if !isValidEnum(string(d.LightLevel), validLightLevels) {
		return nil, &ValidationError{Field: "light_level", Message: "Nivel de luz invalido"}
	}

	d.SoilType = SoilType(input.SoilType)
	if !isValidEnum(string(d.SoilType), validSoilTypes) {
		return nil, &ValidationError{Field: "soil_type", Message: "Tipo de suelo invalido"}
	}

	d.PetToxicity = PetToxicity(input.PetToxicity)
	if !isValidEnum(string(d.PetToxicity), validPetToxicities) {
		return nil, &ValidationError{Field: "pet_toxicity", Message: "Toxicidad invalida"}
	}

	d.PetToxicityNotes = input.PetToxicityNotes

	for _, cat := range input.Categories {
		if !isValidEnum(cat, validPlantCategories) {
			return nil, &ValidationError{Field: "categories", Message: fmt.Sprintf("Categoria invalida: %s", cat)}
		}
	}

	catsJSON, err := json.Marshal(input.Categories)
	if err != nil {
		return nil, fmt.Errorf("marshal categories: %w", err)
	}
	d.CategoriesJSON = string(catsJSON)

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
		d.Images = append(d.Images, PlantDefinitionImage{
			Filepath: strings.TrimSpace(img.Filepath),
			Position: img.Position,
		})
	}

	return d, nil
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
