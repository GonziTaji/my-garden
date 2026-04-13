# Plan de implementacion: imagenes de `plant definition` (solo modo edicion)

## Objetivo
Implementar la edicion de imagenes del formulario de `PlantDefinitionDetails` con estas reglas:

- Maximo 3 imagenes por tipo de planta.
- UI con 3 cards fijas en una grilla de 3 columnas (`grid-cols-3`), alineadas horizontalmente.
- Si hay menos de 3 imagenes existentes, los slots vacios muestran selector de archivo.
- Una imagen existente puede eliminarse o reemplazarse por una nueva.
- Solo cubrir logica de **modo edicion** (no definir ni refactorizar mecanismo edit/view).

---

## Alcance

### Incluye
- Estado local de 3 slots en `app/plant-definitions/components/PlantDefinitionDetails/index.tsx`.
- Render de cards de imagen en modo edicion.
- Construccion de `FormData` consistente por slot (metadata + file).
- Parseo de slots en `app/plant-definitions/actions.ts`.
- Upload de nuevas imagenes en submit (upload-on-save).
- Llamada a `plantDefinitionsService.upsert(...)` con el shape de imagenes ya definido en servicio.

### No incluye
- Cambios en la UX de modo vista.
- Rediseño global del formulario.
- Flujos async de upload antes de guardar.

---

## Contexto actual relevante

- `PlantDefinitionDetails` ya tiene un intento de `formImages` con 3 elementos y handlers parciales.
- Servicio ya acepta:
  - `images?: { existingImages, newImages, removedImageIds }`
- Store ya soporta sincronizacion de imagenes (insert/delete por diff de filepaths).

---

## Diseño recomendado (slot-based)

Usar exactamente 3 slots fijos. Cada slot representa una card de la grilla.

### Tipo de estado por slot

```ts
type ImageSlot = {
  key: string
  existingId?: number
  existingFilepath?: string
  file?: File
  previewUrl: string
}
```

Reglas:
- `existing*` representa imagen persistida en DB.
- `file` representa reemplazo/agregado local en esta edicion.
- `previewUrl` muestra `existingFilepath` o `URL.createObjectURL(file)`.

Inicializacion:
- Slot 0..2 desde `definition.images[0..2]`.
- Si no existe imagen, slot vacio (`previewUrl = ''`).

---

## UX de cada card (modo edicion)

Cada card debe permitir:
- Ver preview si el slot tiene contenido.
- Seleccionar archivo (`input type="file" accept="image/*"`) para agregar/reemplazar.
- Quitar imagen del slot (limpiar).

Comportamiento esperado:
- Slot vacio + seleccionar archivo => preview nueva imagen.
- Slot con existente + seleccionar archivo => reemplazo visual inmediato.
- Slot con existente + quitar => queda vacio.
- Slot con archivo nuevo + quitar => vuelve al estado base del slot (si tenia existing, restaura existing; si no, vacio).

> Nota: si se elige una nueva imagen para un slot con `existing`, en submit eso debe contar como `removedImageIds += existingId` y `newImages += upload(filepath)`.

---

## Limpieza de object URLs

Implementar cleanup para evitar memory leaks:
- Al reemplazar file en un slot: `URL.revokeObjectURL(oldPreviewUrl)` si provenia de `file`.
- En `useEffect` cleanup al desmontar: revocar todos los previews creados con object URL.

---

## Contrato de `FormData` por slot

Usar nombres deterministicos por indice (0, 1, 2):

- `imageSlots[0][existingId]` (hidden)
- `imageSlots[0][existingFilepath]` (hidden)
- `imageSlots[0][file]` (file input)

Repetir para 1 y 2.

Esto evita parseos ambiguos y facilita derivar keep/remove/replace.

---

## Parseo en server action (`upsertPlantDefinition`)

1. Parsear campos de planta (ya existente).
2. Parsear 3 slots en loop.
3. Derivar estructuras para servicio:

- `existingImages`: existentes que se conservan.
- `removedImageIds`: ids de existentes que se quitaron o reemplazaron.
- `newImages`: filepaths de nuevas imagenes subidas.

### Reglas por slot

Para cada slot:
- Tiene `existingId` y NO trae `file` y NO marcado como eliminado -> `existingImages += existing`.
- Tiene `existingId` y trae `file` -> `removedImageIds += existingId` y `newImages += uploaded(filepath)`.
- Tiene `existingId` y fue eliminado sin reemplazo -> `removedImageIds += existingId`.
- No tiene `existingId` y trae `file` -> `newImages += uploaded(filepath)`.
- No tiene `existingId` y no trae `file` -> no-op.

---

## Upload-on-save

Implementar helper de upload en server action (o helper server-side), por cada `File` recibido:

- Validar `file.type.startsWith('image/')`.
- Generar nombre unico (ej. timestamp + random + extension).
- Escribir archivo en storage.
- Retornar filepath publico/relativo.

Storage recomendado por simplicidad: `public/uploads/plant-definitions/`.

---

## Llamada al servicio

Enviar al servicio:

```ts
await plantDefinitionsService.upsert({
  id,
  commonName,
  scientificName,
  waterProfile,
  lightLevel,
  soilType,
  petToxicity,
  petToxicityNotes,
  categories,
  images: {
    existingImages,
    newImages, // [{ filepath }]
    removedImageIds,
  },
})
```

El servicio/store ya se encargan de normalizar y sincronizar DB.

---

## Pasos de implementacion (orden sugerido)

1. Refactorizar estado de imagenes en `PlantDefinitionDetails` a 3 slots fijos claros.
2. Implementar handlers:
   - `handleSelectImage(slotIndex, file)`
   - `handleRemoveImage(slotIndex)`
3. Renderizar la grilla de 3 cards en edit mode con inputs/hidden fields por slot.
4. Agregar parseo de `imageSlots` en `app/plant-definitions/actions.ts`.
5. Implementar upload helper server-side y mapear a `newImages`.
6. Enviar payload `images` al servicio.
7. Verificar manualmente casos clave.

---

## Casos de prueba manual (minimos)

1. **Sin imagenes iniciales**: agregar 1, 2 o 3 y guardar.
2. **Con 1 imagen existente**: eliminar y guardar.
3. **Con 1 existente**: reemplazar por nueva y guardar.
4. **Con 2 existentes**: mantener una, eliminar otra, agregar una nueva.
5. **Con 3 existentes**: reemplazar una, mantener dos.
6. Validar que no se puedan superar 3 slots.
7. Cancelar edicion no debe persistir cambios.

---

## Criterios de aceptacion

- En edit mode siempre se muestran 3 cards de imagen.
- Nunca hay mas de 3 imagenes persistidas por `plant_definition`.
- Reemplazo y eliminacion de imagen existente funcionan correctamente.
- Submit envia datos consistentes al servicio (`existingImages`, `newImages`, `removedImageIds`).
- No hay leaks por object URLs.

---

## Decisiones cerradas (listas para implementar)

1. **Fuente de `existingFilepath` en server**
   - No confiar en `imageSlots[i][existingFilepath]` para persistencia.
   - Resolver `filepath` por `existingId` desde DB en server action.

2. **Limite maximo de imagenes (hard rule)**
   - Validar en server-side que el resultado final nunca supere 3 imagenes.
   - Si supera 3, fallar submit con error explicito.

3. **Limpieza de archivos removidos/reemplazados**
   - Borrar archivo fisico solo si ya no existe ninguna referencia en DB.
   - Evitar borrar archivos que todavia esten asociados a otro registro.

4. **Validacion de uploads**
   - Politica estricta por archivo:
     - mime `image/*` + extension permitida (`.jpg`, `.jpeg`, `.png`, `.webp`).
     - tamano maximo: 5MB.
   - Si un archivo es invalido, falla todo el submit (no skip por slot).

5. **Formato de `filepath` persistido**
   - Guardar rutas root-relative: `/uploads/plant-definitions/<filename>`.

6. **Senal explicita de eliminacion por slot**
   - Extender contrato FormData con flag:
     - `imageSlots[i][removed]` (`"true" | "false"`).
   - Mantener:
     - `imageSlots[i][existingId]`
     - `imageSlots[i][existingFilepath]` (solo UI / referencia secundaria)
     - `imageSlots[i][file]`

7. **Orden de slots persistente**
   - El orden 0/1/2 debe preservarse tras guardar y recargar.

8. **Cobertura create + edit**
   - El parseo de `imageSlots` y upload-on-save aplica tanto a create como a edit en `upsertPlantDefinition`.

9. **Limpieza de object URLs en cliente**
   - Inferir si `previewUrl` es revocable segun presencia de `file` en slot.
   - Revocar al reemplazar archivo y al desmontar.

10. **Mecanismo tecnico para preservar orden**
    - Agregar columna `position` en `plantDefinitionsImages` (0, 1, 2).
    - Leer imagenes ordenadas por `position`.
    - Actualizar insercion/sincronizacion para persistir el indice de slot.

---

## Ajustes al plan de implementacion (derivados de decisiones)

Agregar al orden sugerido:

0. **Migracion DB**: agregar `position` en `plantDefinitionsImages` + backfill para datos existentes.
1. Refactorizar estado de imagenes en `PlantDefinitionDetails` a 3 slots fijos claros.
2. Implementar handlers:
   - `handleSelectImage(slotIndex, file)`
   - `handleRemoveImage(slotIndex)`
3. Renderizar la grilla de 3 cards en edit mode con inputs/hidden fields por slot, incluyendo `removed`.
4. Agregar parseo de `imageSlots` en `app/plant-definitions/actions.ts` (create + edit).
5. Implementar upload helper server-side con validaciones estrictas.
6. Derivar `existingImages`, `newImages`, `removedImageIds` resolviendo existentes desde DB por `existingId`.
7. Aplicar validacion hard de maximo 3 imagenes finales.
8. Enviar payload `images` al servicio.
9. Implementar cleanup de archivos removidos/reemplazados no referenciados.
10. Verificar manualmente casos clave.
