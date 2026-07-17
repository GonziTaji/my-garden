package plantspecies

type StoreInterface interface {
	CreatePlantSpecies(*PlantSpecies) (int64, error)
	GetPlantSpecies(int64, int64) (*PlantSpecies, error)
	UpdatePlantSpecies(*PlantSpecies) error
	DeletePlantSpecies(int64, int64) error
	ExistsPlantSpecies(int64) (bool, error)
	ListPlantSpecies(int64, string) ([]PlantSpecies, error)
	GetSpeciesImageFilepaths(int64) ([]string, error)
	CountImageReferences(string) (int, error)
	ToggleFavorite(int64, int64) (bool, error)
}
