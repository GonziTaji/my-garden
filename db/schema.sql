create table if not exists plants (
  id integer primary key autoincrement not null,
  alias text unique not null,
  name text unique null,

  created_at text default current_timestamp not null,
  updated_at text default current_timestamp not null
);

create table if not exists plants_preferences_types (
  id integer primary key autoincrement,
  name integer unique not null
);

create table if not exists plants_preferences_levels (
  id integer primary key autoincrement,
  name integer unique not null,
  level tinyint not null,

  unique(name, level)
);

create table if not exists plants_preferences (
  id integer primary key autoincrement,
  plant_id integer not null,
  preference_type_id integer not null,
  preference_level_id integer not null,

  foreign key (plant_id) references plants(id),
  foreign key (preference_type_id) references plants_preferences_types(id),
  foreign key (preference_level_id) references plants_preferences_levels(id)
);

