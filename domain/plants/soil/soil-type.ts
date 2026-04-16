import { createEnumWithMeta } from "@/domain/utils/create-enum-with-meta"

export const soilType = createEnumWithMeta({
    aerated: { label: "Aireado" },
    well_draining: { label: "Buen drenaje" },
    moisture_retentive: { label: "Retiene humedad" },
})

export type SoilType = keyof typeof soilType.meta
