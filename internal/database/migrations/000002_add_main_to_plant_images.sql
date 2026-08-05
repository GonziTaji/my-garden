-- +goose Up

ALTER TABLE plant_images ADD COLUMN main BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX idx_plant_images_main ON plant_images (plant_id) WHERE main = true;

-- +goose Down

DROP INDEX IF EXISTS idx_plant_images_main;

ALTER TABLE plant_images DROP COLUMN main;
