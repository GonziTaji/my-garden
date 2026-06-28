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

type EventType string

const (
	EventTypeWatering      EventType = "watering"
	EventTypeFertilizing   EventType = "fertilizing"
	EventTypeRepotting     EventType = "repotting"
	EventTypeNote          EventType = "note"
	EventTypeLocationChange EventType = "location_change"
)

// Entities

type PlantDefinition struct {
	ID               int64                  `json:"id"`
	CommonName       string                 `json:"common_name"`
	ScientificName   string                 `json:"scientific_name"`
	WaterProfile     WaterProfile           `json:"water_profile"`
	LightLevel       LightLevel             `json:"light_level"`
	SoilType         SoilType               `json:"soil_type"`
	PetToxicity      PetToxicity            `json:"pet_toxicity"`
	PetToxicityNotes string                 `json:"pet_toxicity_notes"`
	CategoriesJSON   string                 `json:"categories_json"`
	UserID           int64                  `json:"user_id"`
	Visibility       string                 `json:"visibility"`
	Images           []PlantDefinitionImage `json:"images"`
	CreatedAt        string                 `json:"created_at"`
	UpdatedAt        string                 `json:"updated_at"`
}

type PlantDefinitionImage struct {
	ID                int64  `json:"id"`
	PlantDefinitionID int64  `json:"plant_definition_id"`
	Filepath          string `json:"filepath"`
	Position          int    `json:"position"`
}

type Plant struct {
	ID                int64      `json:"id"`
	Nickname          string     `json:"nickname"`
	Source            NullString `json:"source"`
	PlantDefinitionID int64      `json:"plant_definition_id"`
	AcquiredAt        NullString `json:"acquired_at"`
	Location          NullString `json:"location"`
	Notes             NullString `json:"notes"`
	UserID            int64      `json:"user_id"`
	CreatedAt         string     `json:"created_at"`
	UpdatedAt         string     `json:"updated_at"`
}

type PlantDefinitionBrief struct {
	ID             int64  `json:"id"`
	CommonName     string `json:"common_name"`
	ScientificName string `json:"scientific_name"`
	UserID         int64  `json:"user_id"`
	Visibility     string `json:"visibility"`
}

type PlantImage struct {
	ID        int64  `json:"id"`
	PlantID   int64  `json:"plant_id"`
	Filepath  string `json:"filepath"`
	CreatedAt string `json:"created_at"`
	UserID    int64  `json:"user_id"`
}

type PlantWithDefinition struct {
	ID              int64                `json:"id"`
	Nickname        string               `json:"nickname"`
	Source          NullString           `json:"source"`
	AcquiredAt      NullString           `json:"acquired_at"`
	Location        NullString           `json:"location"`
	Notes           NullString           `json:"notes"`
	PlantDefinition PlantDefinitionBrief `json:"plant_definition"`
	Images          []PlantImage         `json:"images"`
	CreatedAt       string               `json:"created_at"`
	UpdatedAt       string               `json:"updated_at"`
}

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

type PlantEventImage struct {
	ID           int64  `json:"id"`
	PlantEventID int64  `json:"plant_event_id"`
	URL          string `json:"url"`
}

type CalendarEntry struct {
	ID        string    `json:"id"`
	Date      string    `json:"date"`
	EventType EventType `json:"eventType"`
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

var EventTypes = []EnumOption{
	{"watering", "Watering"},
	{"fertilizing", "Fertilizing"},
	{"repotting", "Repotting"},
	{"note", "Note"},
	{"location_change", "Location change"},
}

func AllEnums() map[string][]EnumOption {
	return map[string][]EnumOption{
		"water_profiles":      WaterProfiles,
		"light_levels":        LightLevels,
		"soil_types":          SoilTypes,
		"categories":          PlantCategories,
		"pet_toxicities":      PetToxicities,
		"event_types": EventTypes,
	}
}
