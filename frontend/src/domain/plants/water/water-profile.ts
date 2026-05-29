import { createEnumWithMeta } from "../../utils/create-enum-with-meta.ts"

export const waterProfile = createEnumWithMeta({
  dry_cycle: {
    label: "Hasta secarse",
    description: "El sustrato debe secarse totalmente entre riegos",
  },
  semi_dry_cycle: {
    label: "Parcialmente seco",
  },
  even_moisture: {
    label: "Mantener húmedo",
  },
  wet: {
    label: "Encharcado",
  },
})

export type WaterProfile = keyof typeof waterProfile.meta
