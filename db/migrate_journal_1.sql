create table if not exists plant_journal_entries (
    id integer primary key autoincrement not null,
    plant_id integer not null,
    journal_entry_type text not null,
    entry_created_at text default current_timestamp not null,
    entry_updated_at text default current_timestamp not null,

    foreign key (plant_id) references plants(id) on delete cascade
);

create table if not exists plant_journal_entries_images (
    id integer primary key autoincrement not null,
    plant_journal_entry_id integer not null,
    url text not null,

    foreign key (plant_journal_entry_id) references plant_journal_entries(id) on delete cascade
);