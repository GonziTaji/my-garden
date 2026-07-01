package database

import (
	"database/sql"
	_ "embed"
	"fmt"
	"strings"

	_ "modernc.org/sqlite"
)

//go:embed schema.sql
var schemaSQL string

type ConnectionConfig struct {
	DBName string
}

var open_db *sql.DB = nil

func OpenDatabase(cfg ConnectionConfig) error {
	if open_db != nil {
		return fmt.Errorf("Database already open")
	}

	var err error
	open_db, err = sql.Open("sqlite", cfg.DBName)
	if err != nil {
		return err
	}

	_, err = open_db.Exec("PRAGMA foreign_keys = ON")
	if err != nil {
		return fmt.Errorf("enable foreign keys: %w", err)
	}

	return nil
}

func GetDatabase() (*sql.DB, error) {
	if open_db == nil {
		return nil, fmt.Errorf("No open database")
	}

	return open_db, nil
}

func ApplyMigrations() error {
	if open_db == nil {
		return fmt.Errorf("No open database")
	}

	_, err := open_db.Exec(schemaSQL)
	if err != nil {
		return fmt.Errorf("apply schema: %w", err)
	}

	// migrate existing databases: add watering_date column if missing
	_, err = open_db.Exec("alter table plant_journal_entries add column watering_date text")
	if err != nil && !strings.Contains(err.Error(), "duplicate column") {
		return fmt.Errorf("add watering_date column: %w", err)
	}

	// backfill existing rows that have no watering_date set
	_, err = open_db.Exec(`
		update plant_journal_entries
		set watering_date = date(entry_created_at)
		where watering_date is null and journal_entry_type = 'watering'
	`)
	if err != nil {
		return fmt.Errorf("backfill watering_date: %w", err)
	}

	// deduplicate: keep only the most recent watering per plant per day
	_, err = open_db.Exec(`
		delete from plant_journal_entries
		where id in (
			select id from (
				select id,
					row_number() over (
						partition by plant_id, watering_date
						order by entry_created_at desc
					) as rn
				from plant_journal_entries
				where journal_entry_type = 'watering' and watering_date is not null
			)
			where rn > 1
		)
	`)
	if err != nil {
		return fmt.Errorf("deduplicate watering entries: %w", err)
	}

	// create unique partial index to prevent future duplicates (race condition safety net)
	_, err = open_db.Exec(`
		create unique index if not exists idx_unique_plant_watering_date
			on plant_journal_entries (plant_id, watering_date)
			where journal_entry_type = 'watering'
	`)
	if err != nil {
		return fmt.Errorf("create watering unique index: %w", err)
	}

	// add user_id column to existing tables
	for _, alterSQL := range []string{
		"alter table plant_definitions add column user_id integer references users(id)",
		"alter table plant_definitions add column visibility text not null default 'private'",
		"alter table plants add column user_id integer references users(id)",
		"alter table plant_journal_entries add column user_id integer references users(id)",
		"alter table plant_images add column user_id integer references users(id)",
		"alter table plant_location_history add column user_id integer references users(id)",
	} {
		_, err = open_db.Exec(alterSQL)
		if err != nil && !strings.Contains(err.Error(), "duplicate column") {
			return fmt.Errorf("add user_id column: %w", err)
		}
	}

	// backfill existing rows with user_id = 1 (first admin user)
	for _, table := range []string{"plant_definitions", "plants", "plant_journal_entries", "plant_images", "plant_location_history"} {
		_, err = open_db.Exec(fmt.Sprintf("update %s set user_id = 1 where user_id is null", table))
		if err != nil {
			return fmt.Errorf("backfill %s user_id: %w", table, err)
		}
	}

	// backfill plants.location into plant_location_history (only if location column exists)
	var hasLocationCol bool
	_ = open_db.QueryRow("select count(*) from pragma_table_info('plants') where name = 'location'").Scan(&hasLocationCol)
	if hasLocationCol {
		_, err = open_db.Exec(`
			insert or ignore into plant_location_history (plant_id, location, registered_at, notes)
			select id, location, acquired_at, 'Migrated from plants.location'
			from plants
			where location is not null and location != ''
		`)
		if err != nil {
			return fmt.Errorf("backfill plant locations: %w", err)
		}
	}

	// event unification: migrate journal + location_history into plant_events
	if err := migrateEvents(open_db); err != nil {
		return fmt.Errorf("event unification: %w", err)
	}

	return nil
}

func migrateEvents(db *sql.DB) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// only run if old tables still exist and have data
	var count int
	err = tx.QueryRow("select count(*) from plant_journal_entries").Scan(&count)
	if err != nil || count == 0 {
		return nil
	}

	// 1. migrate journal entries — keep old_id → new_id mapping for images
	type journalRow struct {
		oldID    int64
		plantID  int64
		entryType string
		notes    string
		date     string
		created  string
		userID   int64
	}
	rows, err := tx.Query(`
		select id, plant_id, journal_entry_type,
			coalesce(notes, ''),
			coalesce(watering_date, date(entry_created_at)),
			entry_created_at,
			coalesce(user_id, 1)
		from plant_journal_entries
		order by id
	`)
	if err != nil {
		return fmt.Errorf("query journal entries: %w", err)
	}
	var journalRows []journalRow
	for rows.Next() {
		var r journalRow
		if err := rows.Scan(&r.oldID, &r.plantID, &r.entryType, &r.notes, &r.date, &r.created, &r.userID); err != nil {
			rows.Close()
			return fmt.Errorf("scan journal entry: %w", err)
		}
		journalRows = append(journalRows, r)
	}
	rows.Close()

	type eventMapping struct{ oldID, newID int64 }
	var mappings []eventMapping

	for _, r := range journalRows {
		res, err := tx.Exec(`
			insert into plant_events (plant_id, event_type, event_date, notes, metadata, created_at, user_id)
			values (?, ?, ?, ?, '{}', ?, ?)
		`, r.plantID, r.entryType, r.date, r.notes, r.created, r.userID)
		if err != nil {
			return fmt.Errorf("insert event: %w", err)
		}
		newID, err := res.LastInsertId()
		if err != nil {
			return fmt.Errorf("last insert id: %w", err)
		}
		mappings = append(mappings, eventMapping{oldID: r.oldID, newID: newID})
	}

	// 2. migrate images using the collected mapping
	stmt, err := tx.Prepare("insert into plant_event_images (plant_event_id, url) values (?, ?)")
	if err != nil {
		return fmt.Errorf("prepare image insert: %w", err)
	}
	defer stmt.Close()

	for _, m := range mappings {
		imgRows, err := tx.Query("select url from plant_journal_entry_images where plant_journal_entry_id = ?", m.oldID)
		if err != nil {
			return fmt.Errorf("query images for entry %d: %w", m.oldID, err)
		}
		for imgRows.Next() {
			var url string
			if err := imgRows.Scan(&url); err != nil {
				imgRows.Close()
				return fmt.Errorf("scan image url: %w", err)
			}
			if _, err := stmt.Exec(m.newID, url); err != nil {
				imgRows.Close()
				return fmt.Errorf("insert image: %w", err)
			}
		}
		imgRows.Close()
	}
	stmt.Close()

	// 3. migrate location history
	_, err = tx.Exec(`
		insert into plant_events (plant_id, event_type, event_date, notes, metadata, created_at, user_id)
		select plant_id, 'location_change',
			registered_at,
			notes,
			json_object('location', location),
			created_at,
			coalesce(user_id, 1)
		from plant_location_history
	`)
	if err != nil {
		return fmt.Errorf("migrate location history: %w", err)
	}

	// 4. drop old tables
	for _, table := range []string{"plant_journal_entry_images", "plant_journal_entries", "plant_location_history"} {
		_, err = tx.Exec("drop table if exists " + table)
		if err != nil {
			return fmt.Errorf("drop table %s: %w", table, err)
		}
	}

	// 5. drop location column from plants
	_, err = tx.Exec("alter table plants drop column location")
	if err != nil {
		return fmt.Errorf("drop location column: %w", err)
	}

	return tx.Commit()
}
