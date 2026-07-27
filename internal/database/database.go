package database

import (
	"database/sql"
	"embed"
	"fmt"

	"github.com/pressly/goose/v3"
	_ "modernc.org/sqlite"
)

//go:embed migrations/*.sql
var embedMigrations embed.FS

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

	goose.SetBaseFS(embedMigrations)

	if err := goose.SetDialect("sqlite3"); err != nil {
		return fmt.Errorf("set dialect: %w", err)
	}

	if err := goose.Up(open_db, "migrations"); err != nil {
		return fmt.Errorf("apply migrations: %w", err)
	}

	return nil
}
