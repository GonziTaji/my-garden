import type { PlantDefinition } from './plant-definition'
import type { PlantImage } from './plant-image'

export type { PlantImage }

export interface Plant {
  id: number

  nickname: string
  source?: string

  plantDefinitionId: number

  acquiredAt?: Date
  location?: string

  notes?: string

  images: PlantImage[]
}

export type PlantWithDefinition = Plant & {
  definition: PlantDefinition
}

function plantFullText(plant: PlantWithDefinition) {
  return `${plant.nickname}${plant.definition.commonName}${plant.definition.scientificName}`.toLowerCase()
}

export function fullsearchPlants(
  term: string,
  plants: PlantWithDefinition[]
): PlantWithDefinition[] {
  return plants
    .map((p) => ({
      ...p,
      weight: [...plantFullText(p).matchAll(new RegExp(term, 'ig'))].length,
    }))
    .filter((p) => p.weight > 0)
    .toSorted((a, b) => a.weight - b.weight)
    .map(({ weight: _, ...plant }) => plant)
}
