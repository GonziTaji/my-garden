-- Plant Definitions (tipos de plantas)
create table if not exists plant_definitions (
  id integer primary key autoincrement not null,
  common_name text not null,
  scientific_name text not null collate nocase unique,
  water_profile text not null,
  light_level text not null,
  soil_type text not null,
  categories_json text not null default '[]',
  created_at text default current_timestamp not null,
  updated_at text default current_timestamp not null
);

-- Plants (instancias reales de plantas)
create table if not exists plants (
  id integer primary key autoincrement not null,
  nickname text not null,
  plant_definition_id integer not null,
  acquired_at text null,
  location text null,
  notes text null,
  overrides_water_profile text null,
  created_at text default current_timestamp not null,
  updated_at text default current_timestamp not null,
  foreign key (plant_definition_id) references plant_definitions(id) on delete cascade
);
