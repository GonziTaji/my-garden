package plant

type StoreInterface interface {
	// Plant definitions
	CreatePlantDefinition(*PlantDefinition) (int64, error)
	GetPlantDefinition(int64, int64) (*PlantDefinition, error)
	UpdatePlantDefinition(*PlantDefinition) error
	DeletePlantDefinition(int64, int64) error
	ExistsPlantDefinition(int64) (bool, error)
	ListPlantDefinitions(int64) ([]PlantDefinition, error)
	GetDefinitionImageFilepaths(int64) ([]string, error)
	CountImageReferences(string) (int, error)
	ClonePlantDefinition(int64, int64) (int64, error)
	ToggleFavorite(int64, int64) (bool, error)

	// Plants
	CreatePlant(*Plant) (int64, error)
	GetPlant(int64, int64) (*Plant, error)
	UpdatePlant(*Plant) error
	DeletePlant(int64, int64) error
	GetPlantWithDefinition(int64, int64) (*PlantWithDefinition, error)
	ListPlantsWithDefinition(*int64, int64) ([]PlantWithDefinition, error)

	// Plant Images
	CreatePlantImage(int64, string) (int64, error)
	GetPlantImages(int64) ([]PlantImage, error)
	DeletePlantImage(int64) error
	CountPlantImageReferences(string) (int, error)

	// Events
	CreateEvent(e *PlantEvent) (int64, error)
	DeleteEvent(id int64) error
	GetEvent(eventID int64) (*PlantEvent, error)
	GetEvents(plantID int64) ([]PlantEvent, error)
	GetEventsByDateRange(plantIDs []int64, start, end string, eventType *string) ([]PlantEvent, error)
	GetLastEventDates(plantIDs []int64, eventType *string) (map[int64]*string, error)
	GetCalendarEvents(plantID int64, start, end string) ([]CalendarEntry, error)
}
