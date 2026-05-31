insert into plants
  (nickname, plant_definition_id, source, acquired_at, location, notes)
select 'Jadeita', id, 'Vivero El Jardín', '2025-03-10', 'Salón', 'Le gusta el sol directo de la tarde'
from plant_definitions where scientific_name = 'Crassula ovata';

insert into plants
  (nickname, plant_definition_id, source, acquired_at, location, notes)
select 'Mimo', id, 'Ikea', '2025-06-01', 'Baño', 'Colocar cerca de la ventana'
from plant_definitions where scientific_name = 'Monstera adansonii';

