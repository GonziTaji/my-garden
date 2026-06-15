package plant

import (
	"database/sql"
	"fmt"
	"log"
)

type Store struct {
	db *sql.DB
}

func NewStore(db *sql.DB) *Store {
	return &Store{db: db}
}

// Plant Definitions

func (s *Store) ListPlantDefinitions() ([]PlantDefinition, error) {
	rows, err := s.db.Query(`
		select id, common_name, scientific_name, water_profile, light_level, soil_type,
			pet_toxicity, pet_toxicity_notes, categories_json, created_at, updated_at
		from plant_definitions
		order by common_name asc
	`)
	if err != nil {
		return nil, fmt.Errorf("list definitions: %w", err)
	}
	defer rows.Close()

	defs := make([]PlantDefinition, 0)
	for rows.Next() {
		var d PlantDefinition
		err := rows.Scan(&d.ID, &d.CommonName, &d.ScientificName, &d.WaterProfile,
			&d.LightLevel, &d.SoilType, &d.PetToxicity, &d.PetToxicityNotes,
			&d.CategoriesJSON, &d.CreatedAt, &d.UpdatedAt)
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

func (s *Store) GetPlantDefinition(id int64) (*PlantDefinition, error) {
	row := s.db.QueryRow(`
		select id, common_name, scientific_name, water_profile, light_level, soil_type,
			pet_toxicity, pet_toxicity_notes, categories_json, created_at, updated_at
		from plant_definitions
		where id = ?
	`, id)

	var d PlantDefinition
	err := row.Scan(&d.ID, &d.CommonName, &d.ScientificName, &d.WaterProfile,
		&d.LightLevel, &d.SoilType, &d.PetToxicity, &d.PetToxicityNotes,
		&d.CategoriesJSON, &d.CreatedAt, &d.UpdatedAt)
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
			 pet_toxicity, pet_toxicity_notes, categories_json)
		values (?, ?, ?, ?, ?, ?, ?, ?)
	`, d.CommonName, d.ScientificName, d.WaterProfile, d.LightLevel,
		d.SoilType, d.PetToxicity, d.PetToxicityNotes, d.CategoriesJSON)
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
			categories_json = ?, updated_at = datetime('now', 'localtime')
		where id = ?
	`, d.CommonName, d.ScientificName, d.WaterProfile, d.LightLevel,
		d.SoilType, d.PetToxicity, d.PetToxicityNotes, d.CategoriesJSON, d.ID)
	if err != nil {
		return fmt.Errorf("update definition: %w", err)
	}

	return s.syncDefinitionImages(d.ID, d.Images)
}

func (s *Store) DeletePlantDefinition(id int64) error {
	_, err := s.db.Exec("delete from plant_definitions where id = ?", id)
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

// Plant Definition Images

func (s *Store) GetPlantDefinitionImages(defID int64) ([]PlantDefinitionImage, error) {
	rows, err := s.db.Query(`
		select id, plant_definition_id, filepath, position
		from plant_definition_images
		where plant_definition_id = ?
		order by position asc
	`, defID)
	if err != nil {
		return nil, fmt.Errorf("get definition images: %w", err)
	}
	defer rows.Close()

	images := make([]PlantDefinitionImage, 0)
	for rows.Next() {
		var img PlantDefinitionImage
		err := rows.Scan(&img.ID, &img.PlantDefinitionID, &img.Filepath, &img.Position)
		if err != nil {
			return nil, fmt.Errorf("scan image: %w", err)
		}
		images = append(images, img)
	}
	return images, nil
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

func (s *Store) GetOrphanedFilepaths(keep []string) ([]string, error) {
	if len(keep) == 0 {
		rows, err := s.db.Query(`
			select distinct filepath from plant_definition_images
		`)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		var fps []string
		for rows.Next() {
			var fp string
			if err := rows.Scan(&fp); err != nil {
				return nil, err
			}
			fps = append(fps, fp)
		}
		return fps, nil
	}

	query := `select distinct filepath from plant_definition_images
		where filepath not in (` + placeholders(len(keep)) + `)`
	rows, err := s.db.Query(query, stringsToAny(keep)...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var fps []string
	for rows.Next() {
		var fp string
		if err := rows.Scan(&fp); err != nil {
			return nil, err
		}
		fps = append(fps, fp)
	}
	return fps, nil
}

// Plants

func (s *Store) ListPlants(definitionID *int64) ([]Plant, error) {
	var (
		rows *sql.Rows
		err  error
	)
	if definitionID != nil {
		rows, err = s.db.Query(`
			select id, nickname, source, plant_definition_id, acquired_at,
				location, notes, created_at, updated_at
			from plants
			where plant_definition_id = ?
			order by nickname asc
		`, *definitionID)
	} else {
		rows, err = s.db.Query(`
			select id, nickname, source, plant_definition_id, acquired_at,
				location, notes, created_at, updated_at
			from plants
			order by nickname asc
		`)
	}
	if err != nil {
		return nil, fmt.Errorf("list plants: %w", err)
	}
	defer rows.Close()

	plants := make([]Plant, 0)
	for rows.Next() {
		var p Plant
		err := rows.Scan(&p.ID, &p.Nickname, &p.Source, &p.PlantDefinitionID,
			&p.AcquiredAt, &p.Location, &p.Notes, &p.CreatedAt, &p.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("scan plant: %w", err)
		}
		plants = append(plants, p)
	}
	return plants, nil
}

func (s *Store) GetPlant(id int64) (*Plant, error) {
	row := s.db.QueryRow(`
		select id, nickname, source, plant_definition_id, acquired_at,
			location, notes, created_at, updated_at
		from plants
		where id = ?
	`, id)

	var p Plant
	err := row.Scan(&p.ID, &p.Nickname, &p.Source, &p.PlantDefinitionID,
		&p.AcquiredAt, &p.Location, &p.Notes, &p.CreatedAt, &p.UpdatedAt)
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
			(nickname, source, plant_definition_id, acquired_at, location, notes)
		values (?, ?, ?, ?, ?, ?)
	`, p.Nickname, p.Source, p.PlantDefinitionID, p.AcquiredAt, p.Location, p.Notes)
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
		where id = ?
	`, p.Nickname, p.Source, p.AcquiredAt, p.Notes, p.ID)
	if err != nil {
		return fmt.Errorf("update plant: %w", err)
	}
	return nil
}

func (s *Store) DeletePlant(id int64) error {
	_, err := s.db.Exec("delete from plants where id = ?", id)
	if err != nil {
		return fmt.Errorf("delete plant: %w", err)
	}
	return nil
}

// Plants with Definition (joined)

func (s *Store) ListPlantsWithDefinition(definitionID *int64) ([]PlantWithDefinition, error) {
	var (
		rows *sql.Rows
		err  error
	)

	query := `select p.id, p.nickname, p.source, p.acquired_at, p.notes,
		p.created_at, p.updated_at,
		d.id as def_id, d.common_name, d.scientific_name,
		coalesce(
			(select location from plant_location_history
			 where plant_id = p.id
			 order by registered_at desc, id desc
			 limit 1),
			p.location
		) as location
	from plants p
	inner join plant_definitions d on d.id = p.plant_definition_id`

	if definitionID != nil {
		query += ` where p.plant_definition_id = ?`
		query += ` order by p.nickname asc`
		rows, err = s.db.Query(query, *definitionID)
	} else {
		query += ` order by p.nickname asc`
		rows, err = s.db.Query(query)
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

func (s *Store) GetPlantWithDefinition(id int64) (*PlantWithDefinition, error) {
	row := s.db.QueryRow(`
		select p.id, p.nickname, p.source, p.acquired_at, p.notes,
			p.created_at, p.updated_at,
			d.id as def_id, d.common_name, d.scientific_name,
			coalesce(
				(select location from plant_location_history
				 where plant_id = p.id
				 order by registered_at desc, id desc
				 limit 1),
				p.location
			) as location
		from plants p
		inner join plant_definitions d on d.id = p.plant_definition_id
		where p.id = ?
	`, id)

	var p PlantWithDefinition
	err := row.Scan(&p.ID, &p.Nickname, &p.Source, &p.AcquiredAt,
		&p.Notes, &p.CreatedAt, &p.UpdatedAt,
		&p.PlantDefinition.ID, &p.PlantDefinition.CommonName, &p.PlantDefinition.ScientificName,
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

func (s *Store) CountPlantImageReferences(filepath string) (int, error) {
	var count int
	err := s.db.QueryRow(`
		select count(*) from plant_images where filepath = ?
	`, filepath).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("count plant image refs: %w", err)
	}
	return count, nil
}

// Location History

func (s *Store) CreatePlantLocationHistory(e *PlantLocationHistoryEntry) (int64, error) {
	result, err := s.db.Exec(`
		insert into plant_location_history
			(plant_id, location, registered_at, notes)
		values (?, ?, ?, ?)
	`, e.PlantID, e.Location, e.RegisteredAt, e.Notes)
	if err != nil {
		return 0, fmt.Errorf("create location history: %w", err)
	}
	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("get last insert id: %w", err)
	}
	return id, nil
}

// Journal

func (s *Store) CreateJournalEntry(e *PlantJournalEntry) (int64, error) {
	result, err := s.db.Exec(`
		insert into plant_journal_entries
			(plant_id, journal_entry_type, notes, watering_date)
		values (?, ?, ?, ?)
	`, e.PlantID, e.JournalEntryType, e.Notes, e.WateringDate)
	if err != nil {
		return 0, fmt.Errorf("create journal entry: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("get last insert id: %w", err)
	}
	return id, nil
}

func (s *Store) DeleteJournalEntry(id int64) error {
	_, err := s.db.Exec("delete from plant_journal_entries where id = ?", id)
	if err != nil {
		return fmt.Errorf("delete journal entry: %w", err)
	}
	return nil
}

func (s *Store) GetJournalEntries(plantID int64) ([]PlantJournalEntry, error) {
	rows, err := s.db.Query(`
		select id, plant_id, journal_entry_type, notes, entry_created_at, entry_updated_at, watering_date
		from plant_journal_entries
		where plant_id = ?
		order by entry_created_at desc
	`, plantID)
	if err != nil {
		return nil, fmt.Errorf("get journal entries: %w", err)
	}
	defer rows.Close()

	entries := make([]PlantJournalEntry, 0)
	for rows.Next() {
		var e PlantJournalEntry
		err := rows.Scan(&e.ID, &e.PlantID, &e.JournalEntryType, &e.Notes,
			&e.EntryCreatedAt, &e.EntryUpdatedAt, &e.WateringDate)
		if err != nil {
			return nil, fmt.Errorf("scan journal entry: %w", err)
		}
		entries = append(entries, e)
	}
	return entries, nil
}

func (s *Store) GetWateringEntry(plantID int64, date string) (*PlantJournalEntry, error) {
	row := s.db.QueryRow(`
		select id, plant_id, journal_entry_type, notes, entry_created_at, entry_updated_at, watering_date
		from plant_journal_entries
		where plant_id = ? and journal_entry_type = 'watering' and watering_date = ?
	`, plantID, date)

	var e PlantJournalEntry
	err := row.Scan(&e.ID, &e.PlantID, &e.JournalEntryType, &e.Notes,
		&e.EntryCreatedAt, &e.EntryUpdatedAt, &e.WateringDate)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get watering entry: %w", err)
	}
	return &e, nil
}

func (s *Store) GetWateringHistoryByDateRange(plantIDs []int64, startDate, endDate string) ([]PlantJournalEntry, error) {
	query := `select id, plant_id, journal_entry_type, notes, entry_created_at, entry_updated_at, watering_date
		from plant_journal_entries
		where plant_id in (` + placeholders(len(plantIDs)) + `)
			and journal_entry_type = 'watering'
			and watering_date >= ?
			and watering_date <= ?
		order by plant_id, entry_created_at`

	log.Printf("start and end dates: %s - %s\n", startDate, endDate)
	log.Printf("Query: %s\n", query)

	args := make([]any, 0, len(plantIDs)+2)
	for _, id := range plantIDs {
		args = append(args, id)
	}
	args = append(args, startDate, endDate)

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("get watering history: %w", err)
	}
	defer rows.Close()

	entries := make([]PlantJournalEntry, 0)
	for rows.Next() {
		var e PlantJournalEntry

		err := rows.Scan(&e.ID, &e.PlantID, &e.JournalEntryType, &e.Notes,
			&e.EntryCreatedAt, &e.EntryUpdatedAt, &e.WateringDate)

		if err != nil {
			return nil, fmt.Errorf("scan entry: %w", err)
		}

		entries = append(entries, e)
	}

	log.Printf("entries: %v\n", entries)

	return entries, nil
}

func (s *Store) GetLastWateredDates(plantIDs []int64) (map[int64]*string, error) {
	query := `select p.id, max(j.entry_created_at) as last_watered
		from plants p
		left join plant_journal_entries j on j.plant_id = p.id
			and j.journal_entry_type = 'watering'
		where p.id in (` + placeholders(len(plantIDs)) + `)
		group by p.id`

	args := make([]any, len(plantIDs))
	for i, id := range plantIDs {
		args[i] = id
	}

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("get last watered dates: %w", err)
	}
	defer rows.Close()

	result := make(map[int64]*string)
	for rows.Next() {
		var plantID int64
		var lastWatered sql.NullString
		if err := rows.Scan(&plantID, &lastWatered); err != nil {
			return nil, fmt.Errorf("scan last watered: %w", err)
		}
		if lastWatered.Valid {
			result[plantID] = &lastWatered.String
		} else {
			result[plantID] = nil
		}
	}
	return result, nil
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

func stringsToAny(strs []string) []any {
	result := make([]any, len(strs))
	for i, s := range strs {
		result[i] = s
	}
	return result
}
