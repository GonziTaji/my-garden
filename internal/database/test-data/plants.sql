-- Dev-only seed: 10 plants for admin user (id=1)
-- Requires: users.sql and plant-species-popular.sql to be seeded first.

INSERT INTO plants (nickname, source, plant_species_id, acquired_at, notes, user_id)
SELECT 'Mi Monstera', 'Regalo', id, '2024-03-15', 'La más grande del living', 1
FROM plant_species WHERE scientific_name = 'Monstera deliciosa' LIMIT 1;

INSERT INTO plants (nickname, source, plant_species_id, acquired_at, notes, user_id)
SELECT 'Snake Plant', 'Vivero local', id, '2024-01-10', 'Sobrevivió al invierno sin calefacción', 1
FROM plant_species WHERE scientific_name = 'Dracaena trifasciata' LIMIT 1;

INSERT INTO plants (nickname, source, plant_species_id, acquired_at, notes, user_id)
SELECT 'Pachira', 'Mercado Libre', id, '2024-06-20', 'Tres tallos entrelazados', 1
FROM plant_species WHERE scientific_name = 'Pachira aquatica' LIMIT 1;

INSERT INTO plants (nickname, source, plant_species_id, acquired_at, notes, user_id)
SELECT 'Ficus Elastica', 'IKEA', id, '2023-11-05', 'Le cayó una hoja pero recuperó', 1
FROM plant_species WHERE scientific_name = 'Ficus elastica' LIMIT 1;

INSERT INTO plants (nickname, source, plant_species_id, acquired_at, notes, user_id)
SELECT 'Pilea', 'Amiga', id, '2024-02-14', 'Ya tiene 4 crías', 1
FROM plant_species WHERE scientific_name = 'Pilea peperomioides' LIMIT 1;

INSERT INTO plants (nickname, source, plant_species_id, acquired_at, notes, user_id)
SELECT 'Calathea', 'Vivero', id, '2024-04-01', 'Necesita mucha humedad', 1
FROM plant_species WHERE scientific_name = 'Calathea orbifolia' LIMIT 1;

INSERT INTO plants (nickname, source, plant_species_id, acquired_at, notes, user_id)
SELECT 'Strelitzia', 'Florería', id, '2024-05-10', 'Todavía es joven', 1
FROM plant_species WHERE scientific_name = 'Strelitzia reginae' LIMIT 1;

INSERT INTO plants (nickname, source, plant_species_id, acquired_at, notes, user_id)
SELECT 'Zamioculcas', 'Regalo cumpleaños', id, '2023-09-20', 'Casi no la riego', 1
FROM plant_species WHERE scientific_name = 'Zamioculcas zamiifolia' LIMIT 1;

INSERT INTO plants (nickname, source, plant_species_id, acquired_at, notes, user_id)
SELECT 'Ficus Lyrata', 'PlantaMum', id, '2024-07-01', 'La más caprichosa', 1
FROM plant_species WHERE scientific_name = 'Ficus lyrata' LIMIT 1;

INSERT INTO plants (nickname, source, plant_species_id, acquired_at, notes, user_id)
SELECT 'Pothos Dorado', 'Esqueje', id, '2024-08-15', 'Crece rapidísimo', 1
FROM plant_species WHERE scientific_name = 'Epipremnum aureum' LIMIT 1;
