create table if not exists users (
  id integer primary key autoincrement not null,
  email text not null unique,
  username text not null unique,
  created_at text default (datetime('now', 'localtime')) not null,
  updated_at text default (datetime('now', 'localtime')) not null
);

create table if not exists auth_tokens (
  id integer primary key autoincrement not null,
  email text not null,
  token_hash text not null,
  expires_at text not null,
  used_at text,
  created_at text default (datetime('now', 'localtime')) not null
);

create table if not exists plant_definition_favorites (
  id integer primary key autoincrement not null,
  user_id integer not null references users(id),
  plant_definition_id integer not null references plant_definitions(id) on delete cascade,
  created_at text default (datetime('now', 'localtime')) not null,
  unique(user_id, plant_definition_id)
);

create table if not exists plant_definitions (
  id integer primary key autoincrement not null,
  common_name text not null,
  scientific_name text not null collate nocase unique,
  water_profile text not null,
  light_level text not null,
  soil_type text not null,
  pet_toxicity text not null,
  pet_toxicity_notes text not null default '',
  categories_json text not null default '[]',
  user_id integer references users(id),
  visibility text not null default 'private',
  created_at text default (datetime('now', 'localtime')) not null,
  updated_at text default (datetime('now', 'localtime')) not null
);

create table if not exists plant_definition_images (
  id integer primary key autoincrement not null,
  plant_definition_id integer not null,
  filepath text not null,
  position integer not null,
  foreign key (plant_definition_id) references plant_definitions(id) on delete cascade
);

create unique index if not exists idx_pdi_definition_position
  on plant_definition_images (plant_definition_id, position);

create table if not exists plants (
  id integer primary key autoincrement not null,
  nickname text not null,
  source text null,
  plant_definition_id integer not null,
  acquired_at text null,
  location text null,
  notes text null,
  user_id integer references users(id),
  created_at text default (datetime('now', 'localtime')) not null,
  updated_at text default (datetime('now', 'localtime')) not null,
  foreign key (plant_definition_id) references plant_definitions(id) on delete cascade
);

create table if not exists plant_journal_entries (
  id integer primary key autoincrement not null,
  plant_id integer not null,
  journal_entry_type text not null,
  notes text null,
  entry_created_at text default (datetime('now', 'localtime')) not null,
  entry_updated_at text default (datetime('now', 'localtime')) not null,
  watering_date text null,
  user_id integer references users(id),
  foreign key (plant_id) references plants(id) on delete cascade
);

create table if not exists plant_journal_entry_images (
  id integer primary key autoincrement not null,
  plant_journal_entry_id integer not null,
  url text not null,
  foreign key (plant_journal_entry_id) references plant_journal_entries(id) on delete cascade
);

create table if not exists plant_images (
  id integer primary key autoincrement not null,
  plant_id integer not null,
  filepath text not null,
  created_at text default (datetime('now', 'localtime')) not null,
  user_id integer references users(id),
  foreign key (plant_id) references plants(id) on delete cascade
);

create table if not exists plant_location_history (
  id integer primary key autoincrement not null,
  plant_id integer not null,
  location text not null,
  registered_at text not null default (datetime('now', 'localtime')),
  notes text not null default '',
  created_at text default (datetime('now', 'localtime')) not null,
  user_id integer references users(id),
  foreign key (plant_id) references plants(id) on delete cascade
);

