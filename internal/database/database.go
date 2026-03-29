package database

import (
	"database/sql"
	"fmt"

	_ "modernc.org/sqlite"
)

type ConnectionConfig struct {
	db_name string
}

var open_db *sql.DB = nil

func DefaultConfig() ConnectionConfig {
	return ConnectionConfig{
		db_name: "internal/database/databases/main.db",
	}
}

func OpenDatabase(cfg ConnectionConfig) error {
	if open_db != nil {
		return fmt.Errorf("Database already open")
	}

	var err error
	open_db, err = sql.Open("sqlite", cfg.db_name)

	if err != nil {
		return err
	}

	return nil
}

func GetDatabase() (*sql.DB, error) {
	if open_db != nil {
		return nil, fmt.Errorf("No open database")
	}

	return open_db, nil
}
