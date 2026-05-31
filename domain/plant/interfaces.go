package plant

type StoreInterface interface {
	// Plant definitions
	CreatePlantDefinition(*PlantDefinition) (int64, error)
	GetPlantDefinition(int64) (*PlantDefinition, error)
	UpdatePlantDefinition(*PlantDefinition) error
	DeletePlantDefinition(int64) error
	ExistsPlantDefinition(int64) (bool, error)
	ListPlantDefinitions() ([]PlantDefinition, error)
	GetDefinitionImageFilepaths(int64) ([]string, error)
	CountImageReferences(string) (int, error)

	// Plants
	CreatePlant(*Plant) (int64, error)
	GetPlant(int64) (*Plant, error)
	UpdatePlant(*Plant) error
	DeletePlant(int64) error
	GetPlantWithDefinition(int64) (*PlantWithDefinition, error)
	ListPlantsWithDefinition(*int64) ([]PlantWithDefinition, error)

	// Location History
	CreatePlantLocationHistory(*PlantLocationHistoryEntry) (int64, error)

	// Journal / Watering
	CreateJournalEntry(*PlantJournalEntry) (int64, error)
	DeleteJournalEntry(int64) error
	GetJournalEntries(int64) ([]PlantJournalEntry, error)
	GetWateringEntry(int64, string) (*PlantJournalEntry, error)
	GetWateringHistoryByDateRange([]int64, string, string) ([]PlantJournalEntry, error)
	GetLastWateredDates([]int64) (map[int64]*string, error)
}
