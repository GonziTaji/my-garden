import { createEnumWithMeta } from "@/domain/utils/create-enum-with-meta"

export const soilType = createEnumWithMeta({
  well_draining: { label: "Buen drenaje" },
  moisture_retentive: { label: "Retiene humedad" },
  aerated: { label: "Aireado" },
})

export type SoilType = keyof typeof soilType.meta
