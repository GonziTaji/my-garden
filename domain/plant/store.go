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

// Plant Species

func (s *Store) ListPlantSpecies(userID int64, scope string) ([]PlantSpecies, error) {
	query := `select
		ps.id,
		ps.common_name,
		ps.scientific_name,
		ps.water_profile,
		ps.light_level,
		ps.soil_type,
		ps.pet_toxicity,
		ps.pet_toxicity_notes,
		ps.categories_json,
		ps.notes,
		ps.user_id,
		ps.visibility,
		coalesce(u.username, '') as author_username,
		ps.created_at, ps.updated_at,
		ps.is_quick,
		ps.deleted_at,
		coalesce((select count(*) from plants where plant_species_id = ps.id and user_id = ?), 0) as user_plant_count,
		case when
			exists (select 1 from plant_species_favorites where plant_species_id = ps.id and user_id = ?)
			then 1
			else 0
			end
			as is_favorited
	from plant_species ps
	left join users u on u.id = ps.user_id`

	args := []any{userID, userID}

	switch scope {
	case "mine":
		query += ` where ps.user_id = ? and ps.deleted_at is null`
		args = append(args, userID)
	case "favorites":
		query += ` where exists (select 1 from plant_species_favorites where plant_species_id = ps.id and user_id = ?) and ps.deleted_at is null`
		args = append(args, userID)
	case "linked":
		query += ` where exists (select 1 from plants where plant_species_id = ps.id and user_id = ?) and ps.deleted_at is null`
		args = append(args, userID)
	case "mine-favorites":
		query += ` where (ps.user_id = ? or exists (select 1 from plant_species_favorites where plant_species_id = ps.id and user_id = ?) or exists (select 1 from plants where plant_species_id = ps.id and user_id = ?)) and ps.deleted_at is null`
		args = append(args, userID, userID, userID)
	default:
		query += ` where (ps.visibility = 'public'`
		if userID > 0 {
			query += ` or ps.user_id = ?`
			args = append(args, userID)
		}
		query += `) and ps.deleted_at is null`
	}
	query += ` order by ps.common_name asc`

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("list species: %w", err)
	}
	defer rows.Close()

	species := make([]PlantSpecies, 0)
	for rows.Next() {
		var sp PlantSpecies
		var isQuickInt int
		var userPlantCount int
		var isFavoritedInt int
		err := rows.Scan(
			&sp.ID,
			&sp.CommonName,
			&sp.ScientificName,
			&sp.WaterProfile,
			&sp.LightLevel,
			&sp.SoilType,
			&sp.PetToxicity,
			&sp.PetToxicityNotes,
			&sp.CategoriesJSON,
			&sp.Notes,
			&sp.UserID,
			&sp.Visibility,
			&sp.AuthorUsername,
			&sp.CreatedAt,
			&sp.UpdatedAt,
			&isQuickInt,
			&sp.DeletedAt,
			&userPlantCount,
			&isFavoritedInt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan species: %w", err)
		}
		sp.IsQuick = isQuickInt == 1
		sp.UserPlantCount = userPlantCount
		sp.IsFavorited = isFavoritedInt == 1
		species = append(species, sp)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration: %w", err)
	}

	if len(species) == 0 {
		return species, nil
	}

	for i := range species {
		species[i].Images = []PlantSpeciesImage{}
	}

	ids := make([]int64, len(species))
	idIndex := make(map[int64]int, len(species))
	for i, sp := range species {
		ids[i] = sp.ID
		idIndex[sp.ID] = i
	}

	imgRows, err := s.db.Query(`
		select id, plant_species_id, filepath, position
		from plant_species_images
		where plant_species_id in (`+placeholders(len(ids))+`)
		order by plant_species_id asc, position asc
	`, int64sToAny(ids)...)
	if err != nil {
		return nil, fmt.Errorf("list species images: %w", err)
	}
	defer imgRows.Close()

	for imgRows.Next() {
		var img PlantSpeciesImage
		err := imgRows.Scan(&img.ID, &img.PlantSpeciesID, &img.Filepath, &img.Position)
		if err != nil {
			return nil, fmt.Errorf("scan image: %w", err)
		}
		if idx, ok := idIndex[img.PlantSpeciesID]; ok {
			if species[idx].Images == nil {
				species[idx].Images = []PlantSpeciesImage{}
			}
			species[idx].Images = append(species[idx].Images, img)
		}
	}

	return species, nil
}

func (s *Store) GetPlantSpecies(id int64, userID int64) (*PlantSpecies, error) {
	query := `select ps.id, ps.common_name, ps.scientific_name, ps.water_profile, ps.light_level, ps.soil_type,
		ps.pet_toxicity, ps.pet_toxicity_notes, coalesce(ps.categories_json, "[]"), ps.notes, ps.user_id, ps.visibility,
		coalesce(u.username, '') as author_username,
		ps.created_at, ps.updated_at,
		ps.is_quick, ps.deleted_at,
		coalesce((select count(*) from plants where plant_species_id = ps.id and user_id = ?), 0) as user_plant_count,
		case when exists (select 1 from plant_species_favorites where plant_species_id = ps.id and user_id = ?) then 1 else 0 end as is_favorited
	from plant_species ps
	left join users u on u.id = ps.user_id
	where ps.id = ? and (ps.visibility = 'public'`
	args := []any{userID, userID, id}
	if userID > 0 {
		query += ` or ps.user_id = ?`
		args = append(args, userID)
	}
	query += `)`

	row := s.db.QueryRow(query, args...)

	var sp PlantSpecies
	var isQuickInt int
	var userPlantCount int
	var isFavoritedInt int
	err := row.Scan(&sp.ID, &sp.CommonName, &sp.ScientificName, &sp.WaterProfile,
		&sp.LightLevel, &sp.SoilType, &sp.PetToxicity, &sp.PetToxicityNotes,
		&sp.CategoriesJSON, &sp.Notes, &sp.UserID, &sp.Visibility,
		&sp.AuthorUsername,
		&sp.CreatedAt, &sp.UpdatedAt,
		&isQuickInt, &sp.DeletedAt, &userPlantCount, &isFavoritedInt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get species: %w", err)
	}
	sp.IsQuick = isQuickInt == 1
	sp.UserPlantCount = userPlantCount
	sp.IsFavorited = isFavoritedInt == 1

	imgRows, err := s.db.Query(`
		select id, plant_species_id, filepath, position
		from plant_species_images
		where plant_species_id = ?
		order by position asc
	`, id)
	if err != nil {
		return nil, fmt.Errorf("get species images: %w", err)
	}
	defer imgRows.Close()

	sp.Images = []PlantSpeciesImage{}
	for imgRows.Next() {
		var img PlantSpeciesImage
		err := imgRows.Scan(&img.ID, &img.PlantSpeciesID, &img.Filepath, &img.Position)
		if err != nil {
			return nil, fmt.Errorf("scan image: %w", err)
		}
		sp.Images = append(sp.Images, img)
	}

	return &sp, nil
}

func (s *Store) CreatePlantSpecies(sp *PlantSpecies) (int64, error) {
	result, err := s.db.Exec(`
		insert into plant_species
			(common_name, scientific_name, water_profile, light_level, soil_type,
			 pet_toxicity, pet_toxicity_notes, categories_json, notes, user_id, visibility, is_quick)
		values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, sp.CommonName, sp.ScientificName, sp.WaterProfile, sp.LightLevel,
		sp.SoilType, sp.PetToxicity, sp.PetToxicityNotes, sp.CategoriesJSON,
		sp.Notes, sp.UserID, sp.Visibility, boolToInt(sp.IsQuick))
	if err != nil {
		return 0, fmt.Errorf("create species: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("get last insert id: %w", err)
	}

	for i := range sp.Images {
		sp.Images[i].PlantSpeciesID = id
	}

	if err := s.syncSpeciesImages(id, sp.Images); err != nil {
		return 0, err
	}

	return id, nil
}

func (s *Store) UpdatePlantSpecies(sp *PlantSpecies) error {
	_, err := s.db.Exec(`
		update plant_species
		set common_name = ?, scientific_name = ?, water_profile = ?, light_level = ?,
			soil_type = ?, pet_toxicity = ?, pet_toxicity_notes = ?,
			categories_json = ?, notes = ?, visibility = ?, is_quick = ?,
			updated_at = datetime('now', 'localtime')
		where id = ? and user_id = ?
	`, sp.CommonName, sp.ScientificName, sp.WaterProfile, sp.LightLevel,
		sp.SoilType, sp.PetToxicity, sp.PetToxicityNotes, sp.CategoriesJSON,
		sp.Notes, sp.Visibility, boolToInt(sp.IsQuick), sp.ID, sp.UserID)
	if err != nil {
		return fmt.Errorf("update species: %w", err)
	}

	return s.syncSpeciesImages(sp.ID, sp.Images)
}

func (s *Store) DeletePlantSpecies(id int64, userID int64) error {
	_, err := s.db.Exec("update plant_species set deleted_at = datetime('now', 'localtime') where id = ? and user_id = ?", id, userID)
	if err != nil {
		return fmt.Errorf("delete species: %w", err)
	}
	return nil
}

func (s *Store) ExistsPlantSpecies(id int64) (bool, error) {
	var exists int
	err := s.db.QueryRow("select 1 from plant_species where id = ? and deleted_at is null", id).Scan(&exists)
	if err == sql.ErrNoRows {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("exists species: %w", err)
	}
	return true, nil
}

func (s *Store) CountImageReferences(filepath string) (int, error) {
	var count int
	err := s.db.QueryRow(`
		select count(*) from plant_species_images where filepath = ?
	`, filepath).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("count image refs: %w", err)
	}
	return count, nil
}

func (s *Store) ToggleFavorite(userID int64, speciesID int64) (bool, error) {
	var exists int
	err := s.db.QueryRow(`
		select 1 from plant_species_favorites
		where user_id = ? and plant_species_id = ?
	`, userID, speciesID).Scan(&exists)
	if err == nil {
		_, err = s.db.Exec(`
			delete from plant_species_favorites
			where user_id = ? and plant_species_id = ?
		`, userID, speciesID)
		if err != nil {
			return false, fmt.Errorf("remove favorite: %w", err)
		}
		return false, nil
	}
	if err != sql.ErrNoRows {
		return false, fmt.Errorf("check favorite: %w", err)
	}

	_, err = s.db.Exec(`
		insert into plant_species_favorites (user_id, plant_species_id)
		values (?, ?)
	`, userID, speciesID)
	if err != nil {
		return false, fmt.Errorf("add favorite: %w", err)
	}
	return true, nil
}

func (s *Store) syncSpeciesImages(speciesID int64, images []PlantSpeciesImage) error {
	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback()

	_, err = tx.Exec("delete from plant_species_images where plant_species_id = ?", speciesID)
	if err != nil {
		return fmt.Errorf("delete old images: %w", err)
	}

	for _, img := range images {
		_, err := tx.Exec(`
			insert into plant_species_images
				(plant_species_id, filepath, position)
			values (?, ?, ?)
		`, speciesID, img.Filepath, img.Position)
		if err != nil {
			return fmt.Errorf("insert image: %w", err)
		}
	}

	return tx.Commit()
}

func (s *Store) GetSpeciesImageFilepaths(speciesID int64) ([]string, error) {
	rows, err := s.db.Query(`
		select filepath from plant_species_images where plant_species_id = ?
	`, speciesID)
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
		select id, nickname, source, plant_species_id, acquired_at,
			notes, user_id, created_at, updated_at
		from plants
		where id = ? and user_id = ?
	`, id, userID)

	var p Plant
	err := row.Scan(&p.ID, &p.Nickname, &p.Source, &p.PlantSpeciesID,
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
			(nickname, source, plant_species_id, acquired_at, notes, user_id)
		values (?, ?, ?, ?, ?, ?)
	`, p.Nickname, p.Source, p.PlantSpeciesID, p.AcquiredAt, p.Notes, p.UserID)
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

// Plants with Species (joined)

func (s *Store) ListPlantsWithSpecies(speciesID *int64, userID int64) ([]PlantWithSpecies, error) {
	var (
		rows *sql.Rows
		err  error
	)

	query := `select p.id, p.nickname, p.source, p.acquired_at, p.notes,
		p.created_at, p.updated_at,
		sp.id as species_id, sp.common_name, sp.scientific_name, sp.user_id, sp.visibility, sp.deleted_at,
		coalesce(
			(select json_extract(metadata, '$.location') from plant_events
			 where plant_id = p.id and event_type = 'location_change'
			 order by event_date desc, id desc limit 1),
			''
		) as location
	from plants p
	inner join plant_species sp on sp.id = p.plant_species_id
	where p.user_id = ?`

	if speciesID != nil {
		query += ` and p.plant_species_id = ?`
		query += ` order by p.nickname asc`
		rows, err = s.db.Query(query, userID, *speciesID)
	} else {
		query += ` order by p.nickname asc`
		rows, err = s.db.Query(query, userID)
	}
	if err != nil {
		return nil, fmt.Errorf("list plants with species: %w", err)
	}
	defer rows.Close()

	plants := make([]PlantWithSpecies, 0)
	for rows.Next() {
		var p PlantWithSpecies
		err := rows.Scan(&p.ID, &p.Nickname, &p.Source, &p.AcquiredAt,
			&p.Notes, &p.CreatedAt, &p.UpdatedAt,
			&p.PlantSpecies.ID, &p.PlantSpecies.CommonName, &p.PlantSpecies.ScientificName,
			&p.PlantSpecies.UserID, &p.PlantSpecies.Visibility, &p.PlantSpecies.DeletedAt,
			&p.Location)
		if err != nil {
			return nil, fmt.Errorf("scan plant with species: %w", err)
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

func (s *Store) GetPlantWithSpecies(id int64, userID int64) (*PlantWithSpecies, error) {
	row := s.db.QueryRow(`
		select p.id, p.nickname, p.source, p.acquired_at, p.notes,
			p.created_at, p.updated_at,
			sp.id as species_id, sp.common_name, sp.scientific_name, sp.user_id, sp.visibility, sp.deleted_at,
			coalesce(
				(select json_extract(metadata, '$.location') from plant_events
				 where plant_id = p.id and event_type = 'location_change'
				 order by event_date desc, id desc limit 1),
				''
			) as location
		from plants p
		inner join plant_species sp on sp.id = p.plant_species_id
		where p.id = ? and p.user_id = ?
	`, id, userID)

	var p PlantWithSpecies
	err := row.Scan(&p.ID, &p.Nickname, &p.Source, &p.AcquiredAt,
		&p.Notes, &p.CreatedAt, &p.UpdatedAt,
		&p.PlantSpecies.ID, &p.PlantSpecies.CommonName, &p.PlantSpecies.ScientificName,
		&p.PlantSpecies.UserID, &p.PlantSpecies.Visibility, &p.PlantSpecies.DeletedAt,
		&p.Location)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get plant with species: %w", err)
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

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}
