package plants

import (
	"database/sql"
	"encoding/json"
)

type NullString struct {
	sql.NullString
}

func (ns NullString) MarshalJSON() ([]byte, error) {
	if !ns.Valid {
		return []byte("null"), nil
	}
	return json.Marshal(ns.String)
}

func (ns *NullString) UnmarshalJSON(data []byte) error {
	if string(data) == "null" {
		ns.Valid = false
		return nil
	}
	ns.Valid = true
	return json.Unmarshal(data, &ns.String)
}

func NewNullString(s string) NullString {
	return NullString{sql.NullString{String: s, Valid: s != ""}}
}

type PlantSpeciesBrief struct {
	ID             int64   `json:"id"`
	CommonName     string  `json:"common_name"`
	ScientificName string  `json:"scientific_name"`
	UserID         int64   `json:"user_id"`
	Visibility     string  `json:"visibility"`
	DeletedAt      *string `json:"deleted_at,omitempty"`
}

type PlantImage struct {
	ID        int64  `json:"id"`
	PlantID   int64  `json:"plant_id"`
	Filepath  string `json:"filepath"`
	CreatedAt string `json:"created_at"`
	UserID    int64  `json:"user_id"`
}

type PlantWithSpecies struct {
	ID            int64              `json:"id"`
	Nickname      string             `json:"nickname"`
	Source        NullString         `json:"source"`
	AcquiredAt    NullString         `json:"acquired_at"`
	Location      NullString         `json:"location"`
	Notes         NullString         `json:"notes"`
	PlantSpecies  PlantSpeciesBrief  `json:"plant_species"`
	Images        []PlantImage       `json:"images"`
	CreatedAt     string             `json:"created_at"`
	UpdatedAt     string             `json:"updated_at"`
}

type Plant struct {
	ID            int64      `json:"id"`
	Nickname      string     `json:"nickname"`
	Source        NullString `json:"source"`
	PlantSpeciesID int64      `json:"plant_species_id"`
	AcquiredAt    NullString `json:"acquired_at"`
	Notes         NullString `json:"notes"`
	UserID        int64      `json:"user_id"`
	CreatedAt     string     `json:"created_at"`
	UpdatedAt     string     `json:"updated_at"`
}
