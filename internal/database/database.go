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

func DefaultConfig() ConnectionConfig {
	return ConnectionConfig{
		DBName: "internal/database/databases/main.db",
	}
}

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

func CloseDatabase() error {
	if open_db == nil {
		return nil
	}

	err := open_db.Close()
	open_db = nil
	return err
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

	// backfill plants.location into plant_location_history
	_, err = open_db.Exec(`
		insert or ignore into plant_location_history (plant_id, location, registered_at, notes)
		select id, location, acquired_at, 'Migrated from plants.location'
		from plants
		where location is not null and location != ''
	`)
	if err != nil {
		return fmt.Errorf("backfill plant locations: %w", err)
	}

	return nil
}
