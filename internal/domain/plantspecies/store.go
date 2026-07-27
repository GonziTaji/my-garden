package plantspecies

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
		var userID int64
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
			&userID,
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
		sp.UserID = userID
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
	var nullUserID int64
	err := row.Scan(&sp.ID, &sp.CommonName, &sp.ScientificName, &sp.WaterProfile,
		&sp.LightLevel, &sp.SoilType, &sp.PetToxicity, &sp.PetToxicityNotes,
		&sp.CategoriesJSON, &sp.Notes, &nullUserID, &sp.Visibility,
		&sp.AuthorUsername,
		&sp.CreatedAt, &sp.UpdatedAt,
		&isQuickInt, &sp.DeletedAt, &userPlantCount, &isFavoritedInt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get species: %w", err)
	}
	sp.UserID = nullUserID
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
