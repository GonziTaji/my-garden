alter table plant_definitions
add column pet_toxicity text not null constraint plant_def_pet_toxicity_uniq default 'nontoxic';

alter table plant_definitions drop constraint plant_def_pet_toxicity_uniq

alter table plant_definitions
add column symptoms text not null default '';
