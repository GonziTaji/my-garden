insert into plants
  (nickname, plant_species_id, source, acquired_at, notes)
select 'Jadeita', id, 'Vivero El Jardín', '2025-03-10', 'Le gusta el sol directo de la tarde'
from plant_species where scientific_name = 'Crassula ovata';

insert into plants
  (nickname, plant_species_id, source, acquired_at, notes)
select 'Mimo', id, 'Ikea', '2025-06-01', 'Colocar cerca de la ventana'
from plant_species where scientific_name = 'Monstera adansonii';

insert into plants
  (nickname, plant_species_id, source, acquired_at, notes)
select 'Perlitas', id, 'Etsy', '2025-02-14', 'Regar solo cuando esté seco'
from plant_species where scientific_name = 'Curio rowleyanus';

insert into plants
  (nickname, plant_species_id, source, acquired_at, notes)
select 'Elefantito', id, 'Vivero El Jardín', '2025-04-20', 'Le gusta que sus hojas se sequen entre riegos'
from plant_species where scientific_name = 'Portulacaria afra';

