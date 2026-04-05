-- Migration: Separar Plant Definitions de Plants
-- Ejecutar con: sqlite3 db/main.db < db/migrate.sql

-- 1. Crear tabla plant_definitions
CREATE TABLE IF NOT EXISTS plant_definitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  common_name TEXT NOT NULL,
  scientific_name TEXT NOT NULL COLLATE NOCASE UNIQUE,
  water_profile TEXT NOT NULL,
  light_level TEXT NOT NULL,
  soil_type TEXT NOT NULL,
  categories_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Crear tipo default para plantas existentes
INSERT OR IGNORE INTO plant_definitions (common_name, scientific_name, water_profile, light_level, soil_type, categories_json)
VALUES ('Desconocido', 'Unknown', 'dry_cycle', 'indirect', 'well_draining', '[]');

-- 3. Crear nueva tabla plants con la estructura correcta
CREATE TABLE IF NOT EXISTS plants_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  nickname TEXT NOT NULL,
  plant_definition_id INTEGER NOT NULL,
  acquired_at TEXT NULL,
  location TEXT NULL,
  notes TEXT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (plant_definition_id) REFERENCES plant_definitions(id) ON DELETE CASCADE
);

-- 4. Migrar datos existentes (alias -> nickname, name -> notes)
INSERT INTO plants_new (id, nickname, plant_definition_id, notes, created_at, updated_at)
SELECT 
  id,
  alias,
  (SELECT id FROM plant_definitions WHERE scientific_name = 'Unknown'),
  CASE WHEN name IS NOT NULL AND name != '' THEN 'Nombre original: ' || name ELSE NULL END,
  created_at,
  updated_at
FROM plants;

-- 5. Eliminar tabla vieja y renombrar nueva
DROP TABLE IF EXISTS plants;
ALTER TABLE plants_new RENAME TO plants;

-- 6. Eliminar tablas no utilizadas (plants_preferences y relacionadas)
DROP TABLE IF EXISTS plants_preferences;
DROP TABLE IF EXISTS plants_preferences_types;
DROP TABLE IF EXISTS plants_preferences_levels;

-- Verificar
SELECT 'plant_definitions: ' || COUNT(*) FROM plant_definitions;
SELECT 'plants: ' || COUNT(*) FROM plants;
