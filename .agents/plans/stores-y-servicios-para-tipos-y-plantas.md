# Plan de Implementacion: Stores y Servicios (Tipos y Plantas)

## Objetivo

Implementar una capa consistente de:

- Persistencia (SQLite + Kysely)
- Stores (acceso DB)
- Servicios (use-cases / validacion)
- Server Actions (API para UI)
- Pantallas UI separadas

para que desde el frontend se puedan **crear, listar y eliminar**:

- Tipos de plantas (`PlantDefinition`)
- Plantas reales (`Plant`)

Decisiones ya confirmadas:

- Consumo desde frontend: **Server Actions** (no REST `app/api`)
- UI store: **React state + actions** (sin Zustand/TanStack Query)
- Borrado de Tipo: **en cascada** (borrar tipo elimina sus plantas) con **confirmacion generica** en UI
- Unicidad: `PlantDefinition.scientificName` **unico** y **case-insensitive**
- Normalizacion de `scientificName`: **solo trim** (no lowercasing, no colapsar espacios)

## Estado actual (problemas a corregir)

- El repo no usa `src/`; usa `app/`, `domain/`, `db/` en raiz.
- Existe una sola tabla `plants` con campos mezclados y `watering_cycle` duplicado en [`/home/yogusita/proyectos/my-garden/db/schema.sql`](/home/yogusita/proyectos/my-garden/db/schema.sql).
- Existe un store unico [`/home/yogusita/proyectos/my-garden/db/store.ts`](/home/yogusita/proyectos/my-garden/db/store.ts) usado por server actions en [`/home/yogusita/proyectos/my-garden/app/plants/actions.ts`](/home/yogusita/proyectos/my-garden/app/plants/actions.ts).
- El dominio ya existe en `domain/plants/*` y separa `PlantDefinition` vs `Plant`.

## Alcance

- DB: agregar `plant_definitions` y refactor de `plants` para que sea instancia real ligada por FK.
- Stores nuevos: `plantDefinitionsStore` y `plantsStore`.
- Servicios nuevos para validacion y mapeo.
- UI:
  - Nueva pantalla `/plant-definitions` para tipos.
  - Ajustar `/plants` para que la creacion exija seleccionar un tipo.

No implementar ahora:

- Journal
- Recomendaciones/riego inteligente
- Route Handlers REST

---

## 1) Esquema de DB (SQLite)

### 1.1 Activar FK en SQLite

Requisito: en SQLite, `ON DELETE CASCADE` no funciona si `PRAGMA foreign_keys` esta apagado.

Accion:

- En [`/home/yogusita/proyectos/my-garden/db/connect.ts`](/home/yogusita/proyectos/my-garden/db/connect.ts), asegurar que el `better-sqlite3` tenga `database.pragma('foreign_keys = ON')` al inicializar.

### 1.2 Tabla `plant_definitions`

Crear tabla:

- `id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL`
- `common_name TEXT NOT NULL`
- `scientific_name TEXT NOT NULL COLLATE NOCASE UNIQUE`
- `water_profile TEXT NOT NULL`
- `light_level TEXT NOT NULL`
- `soil_type TEXT NOT NULL`
- `categories_json TEXT NOT NULL` (JSON stringify de `PlantCategory[]`)
- `created_at TEXT DEFAULT current_timestamp NOT NULL`
- `updated_at TEXT DEFAULT current_timestamp NOT NULL`

Notas:

- `scientific_name` case-insensitive via `COLLATE NOCASE`.
- No normalizar mas alla de `trim()` en capa de servicios.

### 1.3 Tabla `plants` (instancias reales)

Estrategia recomendada: migracion incremental para no romper el codigo existente.

Opcion A (preferida): crear `plants_v2`, migrar, luego renombrar.

`plants_v2`:

- `id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL`
- `nickname TEXT NOT NULL` (antes `alias`)
- `plant_definition_id INTEGER NOT NULL`
- `acquired_at TEXT NULL` (ISO)
- `location TEXT NULL`
- `notes TEXT NULL`
- `overrides_water_profile TEXT NULL`
- `created_at TEXT DEFAULT current_timestamp NOT NULL`
- `updated_at TEXT DEFAULT current_timestamp NOT NULL`

Constraints:

- `FOREIGN KEY (plant_definition_id) REFERENCES plant_definitions(id) ON DELETE CASCADE`

### 1.4 Migracion de datos (minima)

Si hay datos existentes en `plants`:

- Migrar `alias -> nickname`.
- `name` antiguo no corresponde al nuevo modelo (porque ahora el nombre cientifico vive en `plant_definitions`).
  - Opcion simple: guardarlo en `notes` durante migracion.
  - Alternativa: descartarlo.

Como ahora `Plant` requiere `plant_definition_id NOT NULL`, se necesita al menos un tipo default para migrar:

- Crear un `plant_definitions` default (por ejemplo: common_name = 'Unknown', scientific_name = 'Unknown') y asignar ese `id` a todas las plantas migradas.

### 1.5 `db/schema.sql` como fuente de verdad

Actualizar [`/home/yogusita/proyectos/my-garden/db/schema.sql`](/home/yogusita/proyectos/my-garden/db/schema.sql) para reflejar el esquema final y eliminar el duplicado `watering_cycle`.

### 1.6 Tipos de Kysely

Si el repo depende de `kysely-codegen` para el tipo `DB` (ver import en `db/connect.ts`):

- Regenerar los tipos despues de actualizar el schema, o cambiar a un `DB` declarado manualmente.

---

## 2) Stores (capa DB)

Objetivo: separar acceso DB por agregado.

### 2.1 Store: Plant Definitions

Crear archivo `db/stores/plant-definitions.store.ts` con funciones:

- `create(input: { commonName: string; scientificName: string; waterProfile: WaterProfile; lightLevel: LightLevel; soilType: SoilType; categories: PlantCategory[] })`
- `listAll()`
- `deleteById(id: number)`

Implementacion:

- Serializar `categories` como JSON string (`categories_json`).
- En `listAll`, parsear `categories_json` a `PlantCategory[]`.

### 2.2 Store: Plants

Crear archivo `db/stores/plants.store.ts` con funciones:

- `create(input: { nickname: string; plantDefinitionId: number })` (campos extra opcionales si ya quieres)
- `listAll()` con join a `plant_definitions` para devolver datos listables
- `getById(id: number)` con join
- `deleteById(id: number)`

Recomendacion para listados:

- Devolver una vista lista para UI:
  - `id`, `nickname`
  - `plantDefinition: { id, commonName, scientificName }`

---

## 3) Servicios (use-cases)

Objetivo: validacion de dominio y traduccion a stores.

Crear carpeta `services/` (o `domain/services/` si el repo lo prefiere) y agregar:

### 3.1 `services/plant-definitions.service.ts`

Responsabilidades:

- Validar que:
  - `commonName.trim().length > 0`
  - `scientificName.trim().length > 0`
  - `waterProfile` pertenece a `waterProfile.values`
  - `lightLevel` pertenece a `lightLevel.values`
  - `soilType` pertenece a `soilType.values`
  - `categories` son valores validos de `plantCategory.values`
- Aplicar `trim()` a `scientificName` y `commonName`.
- Mapear errores DB de unicidad (`UNIQUE`) a error de negocio (mensaje legible).

API sugerida:

- `createPlantDefinition(input)`
- `listPlantDefinitions()`
- `deletePlantDefinition(id)`

### 3.2 `services/plants.service.ts`

Responsabilidades:

- Validar `nickname.trim().length > 0`.
- Validar que `plantDefinitionId` existe (consultando store de definitions o con una query rapida).

API sugerida:

- `createPlant(input)`
- `listPlants()`
- `getPlant(id)`
- `deletePlant(id)`

---

## 4) Server Actions

Consumo desde UI: server actions (no `app/api`).

### 4.1 Tipos: `app/plant-definitions/actions.ts`

Crear:

- `createPlantDefinition(formData: FormData)`:
  - leer campos
  - validar requeridos
  - llamar `plantDefinitionsService.createPlantDefinition`
  - revalidar/refresh de la pagina de tipos
  - devolver `id`

- `deletePlantDefinition(id: number)`:
  - llamar `plantDefinitionsService.deletePlantDefinition`
  - revalidar/refresh

Nota: en el repo actual se usa `refresh()` desde `next/cache`. Mantener consistencia con esa version, o migrar a la API equivalente si `refresh()` no aplica.

### 4.2 Plantas: actualizar `app/plants/actions.ts`

- Cambiar `createPlant(formData)` para:
  - tomar `nickname` (o mantener `alias` y mapear a nickname)
  - tomar `plantDefinitionId`
  - llamar `plantsService.createPlant`
  - revalidar/refresh

- Agregar `deletePlant(id: number)` para UI.

---

## 5) UI

### 5.1 Pantalla nueva: `/plant-definitions`

Crear ruta:

- `app/plant-definitions/page.tsx` (server component) que:
  - obtiene lista inicial desde `plantDefinitionsService.listPlantDefinitions()`
  - renderiza componente client con lista + form

Componentes sugeridos:

- `app/plant-definitions/components/CreatePlantDefinitionForm.tsx` (client)
  - Campos:
    - `commonName` (input)
    - `scientificName` (input)
    - `waterProfile` (select desde `waterProfile.options`)
    - `lightLevel` (select desde `lightLevel.options`)
    - `soilType` (select desde `soilType.options`)
    - `categories` (multi-select o checkboxes desde `plantCategory.options`)
  - `useTransition()` + server action
  - Mostrar error inline si falla la unicidad

- `app/plant-definitions/components/PlantDefinitionsList.tsx` (client)
  - Lista con `commonName` + `scientificName`
  - Boton eliminar:
    - `confirm('Esto eliminara el tipo y todas sus plantas asociadas. Continuar?')`
    - si ok: llamar server action `deletePlantDefinition(id)`

### 5.2 Ajustes en `/plants`

Objetivo: creacion de planta requiere seleccionar un tipo.

Acciones:

- En `app/plants/page.tsx`:
  - Cargar `plant_definitions` para poblar el select.
  - Cambiar el mapeo del listado para incluir info del tipo (join desde store/service).

- En `app/plants/components/CreatePlantForm.tsx`:
  - Cambiar `alias` por `nickname` (o mantener nombre de campo en UI pero mapearlo en server action).
  - Agregar `<select name="plantDefinitionId">` con options.
  - Hacerlo `required`.

- En `app/plants/components/PlantsList/index.tsx`:
  - Mostrar nickname + tipo (common/scientific).
  - Agregar boton eliminar planta si se quiere (con confirmacion simple).

### 5.3 Detalle `/plants/[id]`

No es requisito para el objetivo (crear/listar/eliminar), pero para consistencia:

- Cambiar la vista para que el ciclo de agua venga de `PlantDefinition` y overrides (si existen).

---

## 6) Manejo de errores y UX minima

- En formularios: deshabilitar inputs durante `isPending`.
- Para unicidad de `scientificName`: mostrar error inline (no stack trace).
- Confirmaciones:
  - Tipo: warning generico + cascade.
  - Planta: opcional, pero recomendado.

---

## 7) Verificacion

### 7.1 Checks manuales

1. Crear Tipo con `scientificName = 'Monstera deliciosa'`.
2. Intentar crear otro con `scientificName = 'monstera deliciosa'`.
   - Debe fallar por unicidad case-insensitive con mensaje claro.
3. Crear Planta seleccionando ese tipo.
4. Ver listado de Plantas mostrando nickname + tipo.
5. Eliminar el Tipo con confirmacion generica.
   - Debe desaparecer el tipo y tambien las plantas asociadas (cascade).

### 7.2 Verificacion DB

Ejecutar queries (con sqlite3 o via Kysely) para confirmar:

- Las filas de `plants` con `plant_definition_id` eliminado ya no existen.
- `foreign_keys` esta activo.

---

## 8) Notas de implementacion

- Mantener las enums del dominio como fuente para UI:
  - `waterProfile.options`, `lightLevel.options`, `soilType.options`, `plantCategory.options`.
- `categories_json` debe ser siempre JSON valido; si el usuario no selecciona nada, guardar `[]`.
- Preferir nombres consistentes:
  - DB: snake_case
  - TS: camelCase
