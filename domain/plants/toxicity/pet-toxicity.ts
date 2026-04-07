import { createEnumWithMeta } from "@/domain/utils/create-enum-with-meta"

export const petToxicity = createEnumWithMeta({
    non_toxic: { label: "No tóxico" },
    lightly_toxic: { label: "Medianamente tóxico" },
    highly_toxic: { label: "Muy tóxico" },
    psicotropic: { label: "Psicotrópico" },
})

export type PetToxicity = keyof typeof petToxicity.meta
