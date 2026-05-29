import { createEnumWithMeta } from "../../utils/create-enum-with-meta"

export const petToxicity = createEnumWithMeta({
  beneficial: { label: "Beneficioso" },
  non_toxic: { label: "No tóxico" },
  lightly_toxic: { label: "Medianamente tóxico" },
  highly_toxic: { label: "Muy tóxico" },
})

export type PetToxicity = keyof typeof petToxicity.meta
