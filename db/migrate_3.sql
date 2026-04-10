alter table plant_definitions drop column symptoms;
alter table plant_definitions add column pet_toxicity_notes text not null default '';

