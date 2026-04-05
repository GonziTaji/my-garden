import { createEnumWithMeta } from "@/domain/utils/create-enum-with-meta"

export const lightLevel = createEnumWithMeta({
  low: { label: "Poca luz" },
  indirect: { label: "Luz indirecta" },
  bright_indirect: { label: "Luz brillante indirecta" },
  direct: { label: "Sol directo" },
})

export type LightLevel = keyof typeof lightLevel.meta
