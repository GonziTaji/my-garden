package plant

import (
	"database/sql"
	"encoding/json"
)

type NullString struct {
	sql.NullString
}

func (ns NullString) MarshalJSON() ([]byte, error) {
	if !ns.Valid {
		return []byte("null"), nil
	}
	return json.Marshal(ns.String)
}

func (ns *NullString) UnmarshalJSON(data []byte) error {
	if string(data) == "null" {
		ns.Valid = false
		return nil
	}
	ns.Valid = true
	return json.Unmarshal(data, &ns.String)
}

func NewNullString(s string) NullString {
	return NullString{sql.NullString{String: s, Valid: s != ""}}
}

// Enums

type WaterProfile string

const (
	WaterProfileDryCycle     WaterProfile = "dry_cycle"
	WaterProfileSemiDryCycle WaterProfile = "semi_dry_cycle"
	WaterProfileEvenMoisture WaterProfile = "even_moisture"
	WaterProfileWet          WaterProfile = "wet"
)

type LightLevel string

const (
	LightLevelLow            LightLevel = "low"
	LightLevelIndirect       LightLevel = "indirect"
	LightLevelBrightIndirect LightLevel = "bright_indirect"
	LightLevelDirect         LightLevel = "direct"
)

type SoilType string

const (
	SoilTypeAerated           SoilType = "aerated"
	SoilTypeWellDraining      SoilType = "well_draining"
	SoilTypeMoistureRetentive SoilType = "moisture_retentive"
)

type PlantCategory string

const (
	PlantCategoryCactusSucculent PlantCategory = "cactus_succulent"
	PlantCategoryFern            PlantCategory = "fern"
	PlantCategoryMediterranean   PlantCategory = "mediterranean"
	PlantCategoryCreeper         PlantCategory = "creeper"
	PlantCategoryTree            PlantCategory = "tree"
	PlantCategoryTropical        PlantCategory = "tropical"
	PlantCategoryClimber         PlantCategory = "climber"
)

type PetToxicity string

const (
	PetToxicityBeneficial   PetToxicity = "beneficial"
	PetToxicityNonToxic     PetToxicity = "non_toxic"
	PetToxicityLightlyToxic PetToxicity = "lightly_toxic"
	PetToxicityHighlyToxic  PetToxicity = "highly_toxic"
)

type JournalEntryType string

const (
	JournalEntryTypeWatering    JournalEntryType = "watering"
	JournalEntryTypeFertilizing JournalEntryType = "fertilizing"
	JournalEntryTypeRepotting   JournalEntryType = "repotting"
	JournalEntryTypeNote        JournalEntryType = "note"
)

// Entities

type PlantDefinition struct {
	ID               int64                   `json:"id"`
	CommonName       string                  `json:"common_name"`
	ScientificName   string                  `json:"scientific_name"`
	WaterProfile     WaterProfile            `json:"water_profile"`
	LightLevel       LightLevel              `json:"light_level"`
	SoilType         SoilType                `json:"soil_type"`
	PetToxicity      PetToxicity             `json:"pet_toxicity"`
	PetToxicityNotes string                  `json:"pet_toxicity_notes"`
	CategoriesJSON   string                  `json:"categories_json"`
	Images           []PlantDefinitionImage  `json:"images"`
	CreatedAt        string                  `json:"created_at"`
	UpdatedAt        string                  `json:"updated_at"`
}

type PlantDefinitionImage struct {
	ID                int64  `json:"id"`
	PlantDefinitionID int64  `json:"plant_definition_id"`
	Filepath          string `json:"filepath"`
	Position          int    `json:"position"`
}

type Plant struct {
	ID                int64        `json:"id"`
	Nickname          string       `json:"nickname"`
	Source            NullString   `json:"source"`
	PlantDefinitionID int64        `json:"plant_definition_id"`
	AcquiredAt        NullString   `json:"acquired_at"`
	Location          NullString   `json:"location"`
	Notes             NullString   `json:"notes"`
	CreatedAt         string       `json:"created_at"`
	UpdatedAt         string       `json:"updated_at"`
}

type PlantDefinitionBrief struct {
	ID             int64  `json:"id"`
	CommonName     string `json:"common_name"`
	ScientificName string `json:"scientific_name"`
}

type PlantWithDefinition struct {
	ID              int64                `json:"id"`
	Nickname        string               `json:"nickname"`
	Source          NullString           `json:"source"`
	AcquiredAt      NullString           `json:"acquired_at"`
	Location        NullString           `json:"location"`
	Notes           NullString           `json:"notes"`
	PlantDefinition PlantDefinitionBrief `json:"plant_definition"`
	CreatedAt       string               `json:"created_at"`
	UpdatedAt       string               `json:"updated_at"`
}

type PlantLocationHistoryEntry struct {
	ID           int64  `json:"id"`
	PlantID      int64  `json:"plant_id"`
	Location     string `json:"location"`
	RegisteredAt string `json:"registered_at"`
	Notes        string `json:"notes"`
	CreatedAt    string `json:"created_at"`
}

type PlantJournalEntry struct {
	ID               int64            `json:"id"`
	PlantID          int64            `json:"plant_id"`
	JournalEntryType JournalEntryType `json:"journal_entry_type"`
	Notes            NullString       `json:"notes"`
	EntryCreatedAt   string           `json:"entry_created_at"`
	EntryUpdatedAt   string           `json:"entry_updated_at"`
	WateringDate     string           `json:"watering_date"`
}

type PlantJournalEntryImage struct {
	ID                  int64  `json:"id"`
	PlantJournalEntryID int64  `json:"plant_journal_entry_id"`
	URL                 string `json:"url"`
}

// Enum metadata for client consumption

type EnumOption struct {
	Key   string `json:"key"`
	Label string `json:"label"`
}

var WaterProfiles = []EnumOption{
	{"dry_cycle", "Hasta secarse"},
	{"semi_dry_cycle", "Parcialmente seco"},
	{"even_moisture", "Mantener húmedo"},
	{"wet", "Encharcado"},
}

var LightLevels = []EnumOption{
	{"low", "Poca luz"},
	{"indirect", "Luz indirecta"},
	{"bright_indirect", "Luz brillante indirecta"},
	{"direct", "Sol directo"},
}

var SoilTypes = []EnumOption{
	{"aerated", "Aireado"},
	{"well_draining", "Buen drenaje"},
	{"moisture_retentive", "Retiene humedad"},
}

var PlantCategories = []EnumOption{
	{"cactus_succulent", "Cactus / Suculenta"},
	{"fern", "Helecho"},
	{"mediterranean", "Mediterranea"},
	{"creeper", "Rastrera"},
	{"tree", "Árbol"},
	{"tropical", "Tropical"},
	{"climber", "Trepadora"},
}

var PetToxicities = []EnumOption{
	{"beneficial", "Beneficioso"},
	{"non_toxic", "No tóxico"},
	{"lightly_toxic", "Medianamente tóxico"},
	{"highly_toxic", "Muy tóxico"},
}

var JournalEntryTypes = []EnumOption{
	{"watering", "Watering"},
	{"fertilizing", "Fertilizing"},
	{"repotting", "Repotting"},
	{"note", "Note"},
}

func AllEnums() map[string][]EnumOption {
	return map[string][]EnumOption{
		"water_profiles":      WaterProfiles,
		"light_levels":        LightLevels,
		"soil_types":          SoilTypes,
		"categories":          PlantCategories,
		"pet_toxicities":      PetToxicities,
		"journal_entry_types": JournalEntryTypes,
	}
}
