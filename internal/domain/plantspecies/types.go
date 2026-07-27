package plantspecies

type NullString struct {
	String string
	Valid  bool
}

func NewNullString(s string) NullString {
	return NullString{String: s, Valid: s != ""}
}

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
	LightLevelSemishadow     LightLevel = "semishadow"
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

type PlantSpecies struct {
	ID               int64                `json:"id"`
	CommonName       string               `json:"common_name"`
	ScientificName   string               `json:"scientific_name"`
	WaterProfile     WaterProfile         `json:"water_profile"`
	LightLevel       LightLevel           `json:"light_level"`
	SoilType         SoilType             `json:"soil_type"`
	PetToxicity      PetToxicity          `json:"pet_toxicity"`
	PetToxicityNotes string               `json:"pet_toxicity_notes"`
	CategoriesJSON   string               `json:"categories_json"`
	Notes            string               `json:"notes"`
	UserID           int64                  `json:"user_id"`
	Visibility       string               `json:"visibility"`
	AuthorUsername   string               `json:"author_username"`
	Images           []PlantSpeciesImage  `json:"images"`
	IsFavorited      bool                 `json:"is_favorited"`
	UserPlantCount   int                  `json:"user_plant_count"`
	IsQuick          bool                 `json:"is_quick"`
	DeletedAt        *string              `json:"deleted_at,omitempty"`
	CreatedAt        string               `json:"created_at"`
	UpdatedAt        string               `json:"updated_at"`
}

type PlantSpeciesImage struct {
	ID             int64  `json:"id"`
	PlantSpeciesID int64  `json:"plant_species_id"`
	Filepath       string `json:"filepath"`
	Position       int    `json:"position"`
}

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
	{"semishadow", "Semi sombra"},
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

func AllEnums() map[string][]EnumOption {
	return map[string][]EnumOption{
		"water_profiles": WaterProfiles,
		"light_levels":   LightLevels,
		"soil_types":     SoilTypes,
		"categories":     PlantCategories,
		"pet_toxicities": PetToxicities,
	}
}
