package plant

type StoreInterface interface {
	// Plant species
	CreatePlantSpecies(*PlantSpecies) (int64, error)
	GetPlantSpecies(int64, int64) (*PlantSpecies, error)
	UpdatePlantSpecies(*PlantSpecies) error
	DeletePlantSpecies(int64, int64) error
	ExistsPlantSpecies(int64) (bool, error)
	ListPlantSpecies(int64, string) ([]PlantSpecies, error)
	GetSpeciesImageFilepaths(int64) ([]string, error)
	CountImageReferences(string) (int, error)
	ToggleFavorite(int64, int64) (bool, error)

	// Plants
	CreatePlant(*Plant) (int64, error)
	GetPlant(int64, int64) (*Plant, error)
	UpdatePlant(*Plant) error
	DeletePlant(int64, int64) error
	GetPlantWithSpecies(int64, int64) (*PlantWithSpecies, error)
	ListPlantsWithSpecies(*int64, int64) ([]PlantWithSpecies, error)

	// Plant Images
	CreatePlantImage(int64, string) (int64, error)
	GetPlantImages(int64) ([]PlantImage, error)
	DeletePlantImage(int64) error

	// Events
	CreateEvent(e *PlantEvent) (int64, error)
	DeleteEvent(id int64) error
	GetEvent(eventID int64) (*PlantEvent, error)
	GetEvents(plantID int64) ([]PlantEvent, error)
	GetEventsByDateRange(plantIDs []int64, start, end string, eventType *string) ([]PlantEvent, error)
	GetLastEventDates(plantIDs []int64, eventType *string) (map[int64]*string, error)
	GetCalendarEvents(plantID int64, start, end string) ([]CalendarEntry, error)
}
