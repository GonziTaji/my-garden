package plantspecies

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"slices"
	"strings"
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

type Service struct {
	store StoreInterface
}

func NewService(store StoreInterface) *Service {
	return &Service{store: store}
}

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
var validLightLevels = []string{"low", "indirect", "semishadow", "bright_indirect", "direct"}
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
