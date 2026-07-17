package plants

import "my-garden/internal/domain/plantevents"

type PlantSpeciesStore interface {
	ExistsPlantSpecies(int64) (bool, error)
}

type StoreInterface interface {
	CreatePlant(*Plant) (int64, error)
	GetPlant(int64, int64) (*Plant, error)
	UpdatePlant(*Plant) error
	DeletePlant(int64, int64) error
	GetPlantWithSpecies(int64, int64) (*PlantWithSpecies, error)
	ListPlantsWithSpecies(*int64, int64) ([]PlantWithSpecies, error)
	CreatePlantImage(int64, string) (int64, error)
	GetPlantImages(int64) ([]PlantImage, error)
	DeletePlantImage(int64) error
}

type EventStore interface {
	CreateEvent(e *plantevents.PlantEvent) (int64, error)
}
