insert or ignore into plant_species
  (common_name, scientific_name, water_profile, light_level, soil_type, pet_toxicity, categories_json)
values
  ('Desconocido', 'Unknown', 'dry_cycle', 'indirect', 'well_draining', 'non_toxic', '[]'),
  ('Jade', 'Crassula ovata', 'dry_cycle', 'direct', 'well_draining', 'lightly_toxic', '["cactus_succulent"]'),
  ('String of pearls', 'Curio rowleyanus', 'dry_cycle', 'bright_indirect', 'well_draining', 'lightly_toxic', '["cactus_succulent","creeper"]'),
  ('Fake Jade', 'Portulacaria afra', 'dry_cycle', 'bright_indirect', 'well_draining', 'non_toxic', '["cactus_succulent"]'),
  ('Monkey mask', 'Monstera adansonii', 'even_moisture', 'bright_indirect', 'well_draining', 'lightly_toxic', '["tropical","climber"]');

