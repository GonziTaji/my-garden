import { createEnumWithMeta } from '../../utils/create-enum-with-meta'

export const plantCategory = createEnumWithMeta({
  cactus_succulent: { label: 'Cactus / Suculenta' },
  fern: { label: 'Helecho' },
  mediterranean: { label: 'Mediterranea' },
  creeper: { label: 'Rastrera' },
  tree: { label: 'Árbol' },
  tropical: { label: 'Tropical' },
  climber: { label: 'Trepadora' },
})

export type PlantCategory = keyof typeof plantCategory.meta
