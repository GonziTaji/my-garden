create table if not exists plant_definitions_images (
    id integer primary key autoincrement not null,
    plant_definition_id integer not null,
    filepath text not null,

    foreign key (plant_definition_id) references plant_definitions(id) on delete cascade
);
