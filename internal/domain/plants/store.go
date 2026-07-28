package plants

import (
	"database/sql"
	"fmt"
)

type Store struct {
	db *sql.DB
}

func NewStore(db *sql.DB) *Store {
	return &Store{db: db}
}

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
		) as location,
		spi.filepath
	from plants p
	inner join plant_species sp on sp.id = p.plant_species_id
	inner join plant_species_images spi on sp.id = spi.plant_species_id
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
		var speciesFilepath string

		err := rows.Scan(&p.ID, &p.Nickname, &p.Source, &p.AcquiredAt,
			&p.Notes, &p.CreatedAt, &p.UpdatedAt,
			&p.PlantSpecies.ID, &p.PlantSpecies.CommonName, &p.PlantSpecies.ScientificName,
			&p.PlantSpecies.UserID, &p.PlantSpecies.Visibility, &p.PlantSpecies.DeletedAt,
			&p.Location, &speciesFilepath)
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
