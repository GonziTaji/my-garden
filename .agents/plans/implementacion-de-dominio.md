# 🌱 Plant App — Plan de Implementación de Dominio

## 🎯 Objetivo

Construir un modelo de dominio para una app de plantas que:

* Separe correctamente **definiciones de plantas** vs **plantas reales**
* Modele cuidados como **lenguaje del dominio (enums)**, no como data dinámica
* Permita escalar a lógica inteligente (riego, recomendaciones, etc.)

---

# 1. 📁 Estructura de carpetas

```bash
src/
  domain/
    utils/
      create-enum-with-meta.ts

    plants/
      plant-definition.ts
      plant.ts
      plant-journal.ts

      water/
        water-profile.ts

      light/
        light-level.ts

      soil/
        soil-type.ts

      category/
        plant-category.ts
```

---

# 2. 🧩 Helper base: enums con metadata

## Archivo

```bash
domain/utils/create-enum-with-meta.ts
```

## Implementación

```ts
export function createEnumWithMeta<
  const T extends Record<string, { label: string; description?: string }>
>(meta: T) {
  const values = Object.keys(meta) as (keyof T)[]

  const options = values.map((v) => ({
    value: v,
    label: meta[v].label,
  }))

  return {
    values,
    meta,
    options,
  }
}
```

---

# 3. 💧 Water Profile (patrón de humedad)

## Archivo

```bash
domain/plants/water/water-profile.ts
```

```ts
import { createEnumWithMeta } from "@/domain/utils/create-enum-with-meta"

export const waterProfile = createEnumWithMeta({
  dry_cycle: {
    label: "Dejar secar completamente",
    description: "El sustrato debe secarse totalmente entre riegos",
  },
  semi_dry_cycle: {
    label: "Dejar secar parcialmente",
  },
  even_moisture: {
    label: "Mantener húmedo",
  },
  wet: {
    label: "Siempre húmedo",
  },
})

export type WaterProfile = keyof typeof waterProfile.meta
```

---

# 4. ☀️ Light Level

## Archivo

```bash
domain/plants/light/light-level.ts
```

```ts
import { createEnumWithMeta } from "@/domain/utils/create-enum-with-meta"

export const lightLevel = createEnumWithMeta({
  low: { label: "Poca luz" },
  indirect: { label: "Luz indirecta" },
  bright_indirect: { label: "Luz brillante indirecta" },
  direct: { label: "Sol directo" },
})

export type LightLevel = keyof typeof lightLevel.meta
```

---

# 5. 🌿 Soil Type

## Archivo

```bash
domain/plants/soil/soil-type.ts
```

```ts
import { createEnumWithMeta } from "@/domain/utils/create-enum-with-meta"

export const soilType = createEnumWithMeta({
  well_draining: { label: "Buen drenaje" },
  moisture_retentive: { label: "Retiene humedad" },
  aerated: { label: "Aireado" },
})

export type SoilType = keyof typeof soilType.meta
```

---

# 6. 🌱 Plant Categories (heurísticas)

## Archivo

```bash
domain/plants/category/plant-category.ts
```

```ts
import { createEnumWithMeta } from "@/domain/utils/create-enum-with-meta"

export const plantCategory = createEnumWithMeta({
  cactus_succulent: { label: "Cactus / Suculenta" },
  fern: { label: "Helecho" },
  tropical: { label: "Tropical" },
  climber: { label: "Trepadora" },
})

export type PlantCategory = keyof typeof plantCategory.meta
```

✔ Permitir múltiples categorías

---

# 7. 📚 PlantDefinition (tipo de planta)

## Archivo

```bash
domain/plants/plant-definition.ts
```

```ts
import type { WaterProfile } from "./water/water-profile"
import type { LightLevel } from "./light/light-level"
import type { SoilType } from "./soil/soil-type"
import type { PlantCategory } from "./category/plant-category"

export interface PlantDefinition {
  id: number

  commonName: string
  scientificName: string

  waterProfile: WaterProfile
  lightLevel: LightLevel
  soilType: SoilType

  categories: PlantCategory[]
}
```

✔ Representa especies o tipos
✔ Contiene la “verdad” de cuidados

---

# 8. 🪴 Plant (instancia real)

## Archivo

```bash
domain/plants/plant.ts
```

```ts
import type { WaterProfile } from "./water/water-profile"

export interface Plant {
  id: number

  nickname?: string

  plantDefinitionId: number

  acquiredAt?: Date
  location?: string

  notes?: string

  overrides?: {
    waterProfile?: WaterProfile
  }
}
```

✔ Representa plantas reales del usuario
✔ Permite múltiples instancias de una misma definición
✔ Permite overrides de cuidado

---

# 9. 📓 Plant Journal

## Archivo

```bash
domain/plants/plant-journal.ts
```

```ts
export type PlantJournalEntryType =
  | "watering"
  | "fertilizing"
  | "repotting"
  | "note"

export interface PlantJournalEntry {
  id: number

  plantId: number

  type: PlantJournalEntryType

  date: Date

  notes?: string
}
```

---

# 10. 🔗 Relaciones del dominio

```text
PlantDefinition (Aloe Vera)
        ↓
Plant (tu planta real)
        ↓
PlantJournalEntry (eventos)
```

---

# 11. 🎯 Decisiones clave

## ✅ Enums (código)

* WaterProfile
* LightLevel
* SoilType
* PlantCategory

## ✅ Data (DB)

* PlantDefinition
* Plant
* PlantJournalEntry

---

# 12. 🚫 Anti-patrones a evitar

* ❌ Guardar frecuencia de riego fija
* ❌ Usar tablas para enums pequeños
* ❌ Mezclar PlantDefinition con Plant
* ❌ Hardcodear `<option>` en UI

---

# 13. 🧩 Uso en UI (ejemplo)

```tsx
<select>
  {waterProfile.options.map((opt) => (
    <option key={opt.value} value={opt.value}>
      {opt.label}
    </option>
  ))}
</select>
```

---

# 14. 🚀 Extensiones futuras (no implementar aún)

* Motor de riego dinámico (clima + estación)
* Recomendaciones de sustrato automáticas
* Alertas inteligentes basadas en journal
* Presets por categoría

---

# ✅ Resultado esperado

Un dominio que:

* separa correctamente **definición vs instancia**
* usa enums como **lenguaje del dominio**
* es fácil de extender
* permite lógica avanzada sin refactor
