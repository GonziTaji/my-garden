import type { PlantSpecies } from './plant-species'
import type { PlantImage } from './plant-image'

export type { PlantImage }

export interface Plant {
  id: number

  nickname: string
  source?: string

  plantSpeciesId: number

  acquiredAt?: Date
  location?: string

  notes?: string

  images: PlantImage[]
}

export type PlantWithSpecies = Plant & {
  species: PlantSpecies
}

function plantFullText(plant: PlantWithSpecies) {
  return `${plant.nickname}${plant.species.commonName}${plant.species.scientificName}`.toLowerCase()
}

export function fullsearchPlants(
  term: string,
  plants: PlantWithSpecies[]
): PlantWithSpecies[] {
  return plants
    .map((p) => ({
      ...p,
      weight: [...plantFullText(p).matchAll(new RegExp(term, 'ig'))].length,
    }))
    .filter((p) => p.weight > 0)
    .toSorted((a, b) => a.weight - b.weight)
    .map(({ weight: _, ...plant }) => plant)
}
