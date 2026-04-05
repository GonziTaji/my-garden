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
