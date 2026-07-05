package database

import (
	"database/sql"
	_ "embed"
	"fmt"

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

	// Soft delete support for plant_species
	open_db.Exec("ALTER TABLE plant_species ADD COLUMN deleted_at TEXT DEFAULT NULL")

	return nil
}
