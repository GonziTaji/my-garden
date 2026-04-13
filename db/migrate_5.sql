alter table plant_definitions_images
add column position integer;

update plant_definitions_images as current
set position = (
    select count(*) - 1
    from plant_definitions_images as previous
    where previous.plant_definition_id = current.plant_definition_id
      and previous.id <= current.id
)
where position is null;

create unique index if not exists plant_definitions_images_definition_position_uniq
on plant_definitions_images (plant_definition_id, position);
