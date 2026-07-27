-- +goose Up

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now', 'localtime')) NOT NULL,
  updated_at TEXT DEFAULT (datetime('now', 'localtime')) NOT NULL
);

CREATE TABLE auth_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime')) NOT NULL
);

CREATE TABLE plant_species (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  common_name TEXT NOT NULL,
  scientific_name TEXT NOT NULL DEFAULT '',
  water_profile TEXT NOT NULL,
  light_level TEXT NOT NULL,
  soil_type TEXT NOT NULL,
  pet_toxicity TEXT NOT NULL,
  pet_toxicity_notes TEXT NOT NULL DEFAULT '',
  categories_json TEXT NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '',
  user_id INTEGER NOT NULL REFERENCES users(id),
  visibility TEXT NOT NULL DEFAULT 'private',
  is_quick INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT DEFAULT NULL,
  created_at TEXT DEFAULT (datetime('now', 'localtime')) NOT NULL,
  updated_at TEXT DEFAULT (datetime('now', 'localtime')) NOT NULL
);

CREATE TABLE plant_species_favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  plant_species_id INTEGER NOT NULL REFERENCES plant_species(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now', 'localtime')) NOT NULL,
  UNIQUE(user_id, plant_species_id)
);

CREATE TABLE plant_species_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  plant_species_id INTEGER NOT NULL,
  filepath TEXT NOT NULL,
  position INTEGER NOT NULL,
  FOREIGN KEY (plant_species_id) REFERENCES plant_species(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_psi_species_position ON plant_species_images (plant_species_id, position);

CREATE TABLE plants (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  nickname TEXT NOT NULL,
  source TEXT NULL,
  plant_species_id INTEGER NOT NULL,
  acquired_at TEXT NULL,
  notes TEXT NULL,
  user_id INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now', 'localtime')) NOT NULL,
  updated_at TEXT DEFAULT (datetime('now', 'localtime')) NOT NULL,
  FOREIGN KEY (plant_species_id) REFERENCES plant_species(id) ON DELETE CASCADE
);

CREATE TABLE plant_journal_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  plant_id INTEGER NOT NULL,
  journal_entry_type TEXT NOT NULL,
  notes TEXT NULL,
  entry_created_at TEXT DEFAULT (datetime('now', 'localtime')) NOT NULL,
  entry_updated_at TEXT DEFAULT (datetime('now', 'localtime')) NOT NULL,
  watering_date TEXT NULL,
  user_id INTEGER REFERENCES users(id),
  FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
);

CREATE TABLE plant_journal_entry_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  plant_journal_entry_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  FOREIGN KEY (plant_journal_entry_id) REFERENCES plant_journal_entries(id) ON DELETE CASCADE
);

CREATE TABLE plant_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  plant_id INTEGER NOT NULL,
  filepath TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now', 'localtime')) NOT NULL,
  user_id INTEGER REFERENCES users(id),
  FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
);

CREATE TABLE plant_location_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  plant_id INTEGER NOT NULL,
  location TEXT NOT NULL,
  registered_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (datetime('now', 'localtime')) NOT NULL,
  user_id INTEGER REFERENCES users(id),
  FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
);

CREATE TABLE plant_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_date TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now', 'localtime')) NOT NULL,
  user_id INTEGER REFERENCES users(id)
);

CREATE TABLE plant_event_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  plant_event_id INTEGER NOT NULL REFERENCES plant_events(id) ON DELETE CASCADE,
  url TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_unique_plant_watering_date ON plant_events (plant_id, event_date) WHERE event_type = 'watering';

-- +goose Down

DROP TABLE IF EXISTS plant_event_images;
DROP TABLE IF EXISTS plant_events;
DROP TABLE IF EXISTS plant_location_history;
DROP TABLE IF EXISTS plant_images;
DROP TABLE IF EXISTS plant_journal_entry_images;
DROP TABLE IF EXISTS plant_journal_entries;
DROP TABLE IF EXISTS plants;
DROP TABLE IF EXISTS plant_species_images;
DROP TABLE IF EXISTS plant_species_favorites;
DROP TABLE IF EXISTS plant_species;
DROP TABLE IF EXISTS auth_tokens;
DROP TABLE IF EXISTS users;