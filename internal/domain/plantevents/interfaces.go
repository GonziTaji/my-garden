package plantevents

type StoreInterface interface {
	CreateEvent(e *PlantEvent) (int64, error)
	DeleteEvent(id int64) error
	GetEvent(eventID int64) (*PlantEvent, error)
	GetEvents(plantID int64) ([]PlantEvent, error)
	GetEventsByDateRange(plantIDs []int64, start, end string, eventType *string) ([]PlantEvent, error)
	GetLastEventDates(plantIDs []int64, eventType *string) (map[int64]*string, error)
	GetCalendarEvents(plantID int64, start, end string) ([]CalendarEntry, error)
}
