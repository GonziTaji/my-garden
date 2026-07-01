package plant

import (
	"database/sql"
	"encoding/json"
	"fmt"
)

type Store struct {
	db *sql.DB
}

func NewStore(db *sql.DB) *Store {
	return &Store{db: db}
}

// Plant Definitions

func (s *Store) ListPlantDefinitions(userID int64) ([]PlantDefinition, error) {
	query := `select id, common_name, scientific_name, water_profile, light_level, soil_type,
		pet_toxicity, pet_toxicity_notes, categories_json, user_id, visibility,
		created_at, updated_at
	from plant_definitions
	where visibility = 'public'`

	args := []any{}
	if userID > 0 {
		query += ` or user_id = ?`
		args = append(args, userID)
	}
	query += ` order by common_name asc`

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("list definitions: %w", err)
	}
	defer rows.Close()

	defs := make([]PlantDefinition, 0)
	for rows.Next() {
		var d PlantDefinition
		err := rows.Scan(&d.ID, &d.CommonName, &d.ScientificName, &d.WaterProfile,
			&d.LightLevel, &d.SoilType, &d.PetToxicity, &d.PetToxicityNotes,
			&d.CategoriesJSON, &d.UserID, &d.Visibility,
			&d.CreatedAt, &d.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("scan definition: %w", err)
		}
		defs = append(defs, d)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration: %w", err)
	}

	if len(defs) == 0 {
		return defs, nil
	}

	for i := range defs {
		defs[i].Images = []PlantDefinitionImage{}
	}

	ids := make([]int64, len(defs))
	idIndex := make(map[int64]int, len(defs))
	for i, d := range defs {
		ids[i] = d.ID
		idIndex[d.ID] = i
	}

	imgRows, err := s.db.Query(`
		select id, plant_definition_id, filepath, position
		from plant_definition_images
		where plant_definition_id in (`+placeholders(len(ids))+`)
		order by plant_definition_id asc, position asc
	`, int64sToAny(ids)...)
	if err != nil {
		return nil, fmt.Errorf("list definition images: %w", err)
	}
	defer imgRows.Close()

	for imgRows.Next() {
		var img PlantDefinitionImage
		err := imgRows.Scan(&img.ID, &img.PlantDefinitionID, &img.Filepath, &img.Position)
		if err != nil {
			return nil, fmt.Errorf("scan image: %w", err)
		}
		if idx, ok := idIndex[img.PlantDefinitionID]; ok {
			if defs[idx].Images == nil {
				defs[idx].Images = []PlantDefinitionImage{}
			}
			defs[idx].Images = append(defs[idx].Images, img)
		}
	}

	return defs, nil
}

func (s *Store) GetPlantDefinition(id int64, userID int64) (*PlantDefinition, error) {
	query := `select id, common_name, scientific_name, water_profile, light_level, soil_type,
		pet_toxicity, pet_toxicity_notes, categories_json, user_id, visibility,
		created_at, updated_at
	from plant_definitions
	where id = ? and (visibility = 'public'`
	args := []any{id}
	if userID > 0 {
		query += ` or user_id = ?`
		args = append(args, userID)
	}
	query += `)`

	row := s.db.QueryRow(query, args...)

	var d PlantDefinition
	err := row.Scan(&d.ID, &d.CommonName, &d.ScientificName, &d.WaterProfile,
		&d.LightLevel, &d.SoilType, &d.PetToxicity, &d.PetToxicityNotes,
		&d.CategoriesJSON, &d.UserID, &d.Visibility,
		&d.CreatedAt, &d.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get definition: %w", err)
	}

	imgRows, err := s.db.Query(`
		select id, plant_definition_id, filepath, position
		from plant_definition_images
		where plant_definition_id = ?
		order by position asc
	`, id)
	if err != nil {
		return nil, fmt.Errorf("get definition images: %w", err)
	}
	defer imgRows.Close()

	d.Images = []PlantDefinitionImage{}
	for imgRows.Next() {
		var img PlantDefinitionImage
		err := imgRows.Scan(&img.ID, &img.PlantDefinitionID, &img.Filepath, &img.Position)
		if err != nil {
			return nil, fmt.Errorf("scan image: %w", err)
		}
		d.Images = append(d.Images, img)
	}

	return &d, nil
}

func (s *Store) CreatePlantDefinition(d *PlantDefinition) (int64, error) {
	result, err := s.db.Exec(`
		insert into plant_definitions
			(common_name, scientific_name, water_profile, light_level, soil_type,
			 pet_toxicity, pet_toxicity_notes, categories_json, user_id, visibility)
		values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, d.CommonName, d.ScientificName, d.WaterProfile, d.LightLevel,
		d.SoilType, d.PetToxicity, d.PetToxicityNotes, d.CategoriesJSON,
		d.UserID, d.Visibility)
	if err != nil {
		return 0, fmt.Errorf("create definition: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("get last insert id: %w", err)
	}

	for i := range d.Images {
		d.Images[i].PlantDefinitionID = id
	}

	if err := s.syncDefinitionImages(id, d.Images); err != nil {
		return 0, err
	}

	return id, nil
}

func (s *Store) UpdatePlantDefinition(d *PlantDefinition) error {
	_, err := s.db.Exec(`
		update plant_definitions
		set common_name = ?, scientific_name = ?, water_profile = ?, light_level = ?,
			soil_type = ?, pet_toxicity = ?, pet_toxicity_notes = ?,
			categories_json = ?, visibility = ?,
			updated_at = datetime('now', 'localtime')
		where id = ? and user_id = ?
	`, d.CommonName, d.ScientificName, d.WaterProfile, d.LightLevel,
		d.SoilType, d.PetToxicity, d.PetToxicityNotes, d.CategoriesJSON,
		d.Visibility, d.ID, d.UserID)
	if err != nil {
		return fmt.Errorf("update definition: %w", err)
	}

	return s.syncDefinitionImages(d.ID, d.Images)
}

func (s *Store) DeletePlantDefinition(id int64, userID int64) error {
	_, err := s.db.Exec("delete from plant_definitions where id = ? and user_id = ?", id, userID)
	if err != nil {
		return fmt.Errorf("delete definition: %w", err)
	}
	return nil
}

func (s *Store) ExistsPlantDefinition(id int64) (bool, error) {
	var exists int
	err := s.db.QueryRow("select 1 from plant_definitions where id = ?", id).Scan(&exists)
	if err == sql.ErrNoRows {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("exists definition: %w", err)
	}
	return true, nil
}

func (s *Store) CountImageReferences(filepath string) (int, error) {
	var count int
	err := s.db.QueryRow(`
		select count(*) from plant_definition_images where filepath = ?
	`, filepath).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("count image refs: %w", err)
	}
	return count, nil
}

func (s *Store) ClonePlantDefinition(defID int64, userID int64) (int64, error) {
	def, err := s.GetPlantDefinition(defID, userID)
	if err != nil {
		return 0, err
	}
	if def == nil {
		return 0, fmt.Errorf("definition not found")
	}

	result, err := s.db.Exec(`
		insert into plant_definitions
			(common_name, scientific_name, water_profile, light_level, soil_type,
			 pet_toxicity, pet_toxicity_notes, categories_json, user_id, visibility)
		values (?, ?, ?, ?, ?, ?, ?, ?, ?, 'private')
	`, def.CommonName, def.ScientificName, def.WaterProfile, def.LightLevel,
		def.SoilType, def.PetToxicity, def.PetToxicityNotes, def.CategoriesJSON, userID)
	if err != nil {
		return 0, fmt.Errorf("clone definition: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("get last insert id: %w", err)
	}

	for _, img := range def.Images {
		_, err := s.db.Exec(`
			insert into plant_definition_images (plant_definition_id, filepath, position)
			values (?, ?, ?)
		`, id, img.Filepath, img.Position)
		if err != nil {
			return 0, fmt.Errorf("clone definition image: %w", err)
		}
	}

	return id, nil
}

func (s *Store) ToggleFavorite(userID int64, defID int64) (bool, error) {
	var exists int
	err := s.db.QueryRow(`
		select 1 from plant_definition_favorites
		where user_id = ? and plant_definition_id = ?
	`, userID, defID).Scan(&exists)
	if err == nil {
		_, err = s.db.Exec(`
			delete from plant_definition_favorites
			where user_id = ? and plant_definition_id = ?
		`, userID, defID)
		if err != nil {
			return false, fmt.Errorf("remove favorite: %w", err)
		}
		return false, nil
	}
	if err != sql.ErrNoRows {
		return false, fmt.Errorf("check favorite: %w", err)
	}

	_, err = s.db.Exec(`
		insert into plant_definition_favorites (user_id, plant_definition_id)
		values (?, ?)
	`, userID, defID)
	if err != nil {
		return false, fmt.Errorf("add favorite: %w", err)
	}
	return true, nil
}

func (s *Store) syncDefinitionImages(defID int64, images []PlantDefinitionImage) error {
	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback()

	_, err = tx.Exec("delete from plant_definition_images where plant_definition_id = ?", defID)
	if err != nil {
		return fmt.Errorf("delete old images: %w", err)
	}

	for _, img := range images {
		_, err := tx.Exec(`
			insert into plant_definition_images
				(plant_definition_id, filepath, position)
			values (?, ?, ?)
		`, defID, img.Filepath, img.Position)
		if err != nil {
			return fmt.Errorf("insert image: %w", err)
		}
	}

	return tx.Commit()
}

func (s *Store) GetDefinitionImageFilepaths(defID int64) ([]string, error) {
	rows, err := s.db.Query(`
		select filepath from plant_definition_images where plant_definition_id = ?
	`, defID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var filepaths []string
	for rows.Next() {
		var fp string
		if err := rows.Scan(&fp); err != nil {
			return nil, err
		}
		filepaths = append(filepaths, fp)
	}
	return filepaths, nil
}

// Plants

func (s *Store) GetPlant(id int64, userID int64) (*Plant, error) {
	row := s.db.QueryRow(`
		select id, nickname, source, plant_definition_id, acquired_at,
			notes, user_id, created_at, updated_at
		from plants
		where id = ? and user_id = ?
	`, id, userID)

	var p Plant
	err := row.Scan(&p.ID, &p.Nickname, &p.Source, &p.PlantDefinitionID,
		&p.AcquiredAt, &p.Notes, &p.UserID, &p.CreatedAt, &p.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get plant: %w", err)
	}
	return &p, nil
}

func (s *Store) CreatePlant(p *Plant) (int64, error) {
	result, err := s.db.Exec(`
		insert into plants
			(nickname, source, plant_definition_id, acquired_at, notes, user_id)
		values (?, ?, ?, ?, ?, ?)
	`, p.Nickname, p.Source, p.PlantDefinitionID, p.AcquiredAt, p.Notes, p.UserID)
	if err != nil {
		return 0, fmt.Errorf("create plant: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("get last insert id: %w", err)
	}
	return id, nil
}

func (s *Store) UpdatePlant(p *Plant) error {
	_, err := s.db.Exec(`
		update plants
		set nickname = ?, source = ?, acquired_at = ?, notes = ?,
			updated_at = datetime('now', 'localtime')
		where id = ? and user_id = ?
	`, p.Nickname, p.Source, p.AcquiredAt, p.Notes, p.ID, p.UserID)
	if err != nil {
		return fmt.Errorf("update plant: %w", err)
	}
	return nil
}

func (s *Store) DeletePlant(id int64, userID int64) error {
	_, err := s.db.Exec("delete from plants where id = ? and user_id = ?", id, userID)
	if err != nil {
		return fmt.Errorf("delete plant: %w", err)
	}
	return nil
}

// Plants with Definition (joined)

func (s *Store) ListPlantsWithDefinition(definitionID *int64, userID int64) ([]PlantWithDefinition, error) {
	var (
		rows *sql.Rows
		err  error
	)

	query := `select p.id, p.nickname, p.source, p.acquired_at, p.notes,
		p.created_at, p.updated_at,
		d.id as def_id, d.common_name, d.scientific_name, d.user_id, d.visibility,
		coalesce(
			(select json_extract(metadata, '$.location') from plant_events
			 where plant_id = p.id and event_type = 'location_change'
			 order by event_date desc, id desc limit 1),
			''
		) as location
	from plants p
	inner join plant_definitions d on d.id = p.plant_definition_id
	where p.user_id = ?`

	if definitionID != nil {
		query += ` and p.plant_definition_id = ?`
		query += ` order by p.nickname asc`
		rows, err = s.db.Query(query, userID, *definitionID)
	} else {
		query += ` order by p.nickname asc`
		rows, err = s.db.Query(query, userID)
	}
	if err != nil {
		return nil, fmt.Errorf("list plants with definition: %w", err)
	}
	defer rows.Close()

	plants := make([]PlantWithDefinition, 0)
	for rows.Next() {
		var p PlantWithDefinition
		err := rows.Scan(&p.ID, &p.Nickname, &p.Source, &p.AcquiredAt,
			&p.Notes, &p.CreatedAt, &p.UpdatedAt,
			&p.PlantDefinition.ID, &p.PlantDefinition.CommonName, &p.PlantDefinition.ScientificName,
			&p.PlantDefinition.UserID, &p.PlantDefinition.Visibility,
			&p.Location)
		if err != nil {
			return nil, fmt.Errorf("scan plant with definition: %w", err)
		}
		p.Images = []PlantImage{}
		plants = append(plants, p)
	}

	if len(plants) == 0 {
		return plants, nil
	}

	plantIDs := make([]int64, len(plants))
	plantIDIndex := make(map[int64]int, len(plants))
	for i, p := range plants {
		plantIDs[i] = p.ID
		plantIDIndex[p.ID] = i
	}

	imgRows, err := s.db.Query(`
		select id, plant_id, filepath, created_at
		from plant_images
		where plant_id in (`+placeholders(len(plantIDs))+`)
		order by plant_id asc, created_at asc
	`, int64sToAny(plantIDs)...)
	if err != nil {
		return nil, fmt.Errorf("list plant images: %w", err)
	}
	defer imgRows.Close()

	for imgRows.Next() {
		var img PlantImage
		err := imgRows.Scan(&img.ID, &img.PlantID, &img.Filepath, &img.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("scan plant image: %w", err)
		}
		if idx, ok := plantIDIndex[img.PlantID]; ok {
			plants[idx].Images = append(plants[idx].Images, img)
		}
	}

	return plants, nil
}

func (s *Store) GetPlantWithDefinition(id int64, userID int64) (*PlantWithDefinition, error) {
	row := s.db.QueryRow(`
		select p.id, p.nickname, p.source, p.acquired_at, p.notes,
			p.created_at, p.updated_at,
			d.id as def_id, d.common_name, d.scientific_name, d.user_id, d.visibility,
			coalesce(
				(select json_extract(metadata, '$.location') from plant_events
				 where plant_id = p.id and event_type = 'location_change'
				 order by event_date desc, id desc limit 1),
				''
			) as location
		from plants p
		inner join plant_definitions d on d.id = p.plant_definition_id
		where p.id = ? and p.user_id = ?
	`, id, userID)

	var p PlantWithDefinition
	err := row.Scan(&p.ID, &p.Nickname, &p.Source, &p.AcquiredAt,
		&p.Notes, &p.CreatedAt, &p.UpdatedAt,
		&p.PlantDefinition.ID, &p.PlantDefinition.CommonName, &p.PlantDefinition.ScientificName,
		&p.PlantDefinition.UserID, &p.PlantDefinition.Visibility,
		&p.Location)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get plant with definition: %w", err)
	}

	p.Images, err = s.GetPlantImages(id)
	if err != nil {
		return nil, fmt.Errorf("get plant images: %w", err)
	}

	return &p, nil
}

// Plant Images

func (s *Store) CreatePlantImage(plantID int64, filepath string) (int64, error) {
	result, err := s.db.Exec(`
		insert into plant_images (plant_id, filepath)
		values (?, ?)
	`, plantID, filepath)
	if err != nil {
		return 0, fmt.Errorf("create plant image: %w", err)
	}
	return result.LastInsertId()
}

func (s *Store) GetPlantImages(plantID int64) ([]PlantImage, error) {
	rows, err := s.db.Query(`
		select id, plant_id, filepath, created_at
		from plant_images
		where plant_id = ?
		order by created_at asc
	`, plantID)
	if err != nil {
		return nil, fmt.Errorf("get plant images: %w", err)
	}
	defer rows.Close()

	images := make([]PlantImage, 0)
	for rows.Next() {
		var img PlantImage
		err := rows.Scan(&img.ID, &img.PlantID, &img.Filepath, &img.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("scan plant image: %w", err)
		}
		images = append(images, img)
	}
	return images, nil
}

func (s *Store) DeletePlantImage(id int64) error {
	_, err := s.db.Exec("delete from plant_images where id = ?", id)
	if err != nil {
		return fmt.Errorf("delete plant image: %w", err)
	}
	return nil
}

// Events

func (s *Store) CreateEvent(e *PlantEvent) (int64, error) {
	result, err := s.db.Exec(`
		insert into plant_events
			(plant_id, event_type, event_date, notes, metadata, user_id)
		values (?, ?, ?, ?, ?, ?)
	`, e.PlantID, e.EventType, e.EventDate, e.Notes, string(e.Metadata), e.UserID)
	if err != nil {
		return 0, fmt.Errorf("create event: %w", err)
	}
	return result.LastInsertId()
}

func (s *Store) GetEvent(eventID int64) (*PlantEvent, error) {
	row := s.db.QueryRow(`
		select id, plant_id, event_type, event_date, notes, metadata, created_at, user_id
		from plant_events
		where id = ?
	`, eventID)

	var e PlantEvent
	var metadataStr string
	err := row.Scan(&e.ID, &e.PlantID, &e.EventType, &e.EventDate, &e.Notes,
		&metadataStr, &e.CreatedAt, &e.UserID)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get event: %w", err)
	}
	e.Metadata = json.RawMessage(metadataStr)
	return &e, nil
}

func (s *Store) DeleteEvent(id int64) error {
	_, err := s.db.Exec("delete from plant_events where id = ?", id)
	if err != nil {
		return fmt.Errorf("delete event: %w", err)
	}
	return nil
}

func (s *Store) GetEvents(plantID int64) ([]PlantEvent, error) {
	rows, err := s.db.Query(`
		select id, plant_id, event_type, event_date, notes, metadata, created_at, user_id
		from plant_events
		where plant_id = ?
		order by event_date desc, id desc
	`, plantID)
	if err != nil {
		return nil, fmt.Errorf("get events: %w", err)
	}
	defer rows.Close()

	events := make([]PlantEvent, 0)
	for rows.Next() {
		var e PlantEvent
		var metadataStr string
		err := rows.Scan(&e.ID, &e.PlantID, &e.EventType, &e.EventDate, &e.Notes,
			&metadataStr, &e.CreatedAt, &e.UserID)
		if err != nil {
			return nil, fmt.Errorf("scan event: %w", err)
		}
		e.Metadata = json.RawMessage(metadataStr)
		events = append(events, e)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration: %w", err)
	}

	// batch load images
	s.loadEventImages(events)

	return events, nil
}

func (s *Store) loadEventImages(events []PlantEvent) {
	if len(events) == 0 {
		return
	}
	ids := make([]int64, len(events))
	idIndex := make(map[int64]int, len(events))
	for i, e := range events {
		ids[i] = e.ID
		idIndex[e.ID] = i
	}

	rows, err := s.db.Query(`
		select plant_event_id, url from plant_event_images
		where plant_event_id in (`+placeholders(len(ids))+`)
		order by plant_event_id asc, id asc
	`, int64sToAny(ids)...)
	if err != nil {
		return
	}
	defer rows.Close()

	for rows.Next() {
		var eventID int64
		var url string
		if err := rows.Scan(&eventID, &url); err != nil {
			continue
		}
		if idx, ok := idIndex[eventID]; ok {
			events[idx].Images = append(events[idx].Images, url)
		}
	}
}

func (s *Store) GetEventsByDateRange(plantIDs []int64, start, end string, eventType *string) ([]PlantEvent, error) {
	query := `select id, plant_id, event_type, event_date, notes, metadata, created_at, user_id
		from plant_events
		where plant_id in (` + placeholders(len(plantIDs)) + `)
			and event_date >= ? and event_date <= ?`
	args := make([]any, 0, len(plantIDs)+2)
	for _, id := range plantIDs {
		args = append(args, id)
	}
	args = append(args, start, end)

	if eventType != nil {
		query += ` and event_type = ?`
		args = append(args, *eventType)
	}
	query += ` order by plant_id, event_date desc`

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("get events by date range: %w", err)
	}
	defer rows.Close()

	events := make([]PlantEvent, 0)
	for rows.Next() {
		var e PlantEvent
		var metadataStr string
		err := rows.Scan(&e.ID, &e.PlantID, &e.EventType, &e.EventDate, &e.Notes,
			&metadataStr, &e.CreatedAt, &e.UserID)
		if err != nil {
			return nil, fmt.Errorf("scan event: %w", err)
		}
		e.Metadata = json.RawMessage(metadataStr)
		events = append(events, e)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration: %w", err)
	}

	return events, nil
}

func (s *Store) GetLastEventDates(plantIDs []int64, eventType *string) (map[int64]*string, error) {
	query := `select p.id, max(e.event_date) as last_date
		from plants p
		left join plant_events e on e.plant_id = p.id`
	args := make([]any, 0, len(plantIDs)+1)
	args = append(args, int64sToAny(plantIDs)...)

	if eventType != nil {
		query += ` and e.event_type = ?`
		args = append(args, *eventType)
	}

	query += ` where p.id in (` + placeholders(len(plantIDs)) + `)
		group by p.id`

	rows, err := s.db.Query(query, int64sToAny(plantIDs)...)
	if err != nil {
		return nil, fmt.Errorf("get last event dates: %w", err)
	}
	defer rows.Close()

	result := make(map[int64]*string)
	for rows.Next() {
		var plantID int64
		var lastDate sql.NullString
		if err := rows.Scan(&plantID, &lastDate); err != nil {
			return nil, fmt.Errorf("scan last event date: %w", err)
		}
		if lastDate.Valid {
			result[plantID] = &lastDate.String
		} else {
			result[plantID] = nil
		}
	}
	return result, nil
}

func (s *Store) GetCalendarEvents(plantID int64, start, end string) ([]CalendarEntry, error) {
	rows, err := s.db.Query(`
		select id, event_type, event_date
		from plant_events
		where plant_id = ? and event_date >= ? and event_date <= ?
		order by event_date desc
	`, plantID, start, end)
	if err != nil {
		return nil, fmt.Errorf("get calendar events: %w", err)
	}
	defer rows.Close()

	entries := make([]CalendarEntry, 0)
	for rows.Next() {
		var entry CalendarEntry
		var id int64
		if err := rows.Scan(&id, &entry.EventType, &entry.Date); err != nil {
			return nil, fmt.Errorf("scan calendar entry: %w", err)
		}
		entry.ID = fmt.Sprintf("%d", id)
		entries = append(entries, entry)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration: %w", err)
	}
	return entries, nil
}

func placeholders(n int) string {
	if n == 0 {
		return "select null where false"
	}
	b := make([]byte, 0, n*2-1)
	for i := range n {
		if i > 0 {
			b = append(b, ',')
		}
		b = append(b, '?')
	}
	return string(b)
}

func int64sToAny(ids []int64) []any {
	result := make([]any, len(ids))
	for i, id := range ids {
		result[i] = id
	}
	return result
}


