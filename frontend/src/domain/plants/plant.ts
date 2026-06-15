import type { PlantDefinition } from "./plant-definition"
import type { PlantImage } from "./plant-image"

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

export type PlantGroup = {
  plants: PlantWithDefinition[]
  definition: PlantWithDefinition['definition']
}

export type PlantsByDefinitionMap = Record<string, PlantGroup>

export function groupPlantsByDefinition(plants: PlantWithDefinition[]): PlantsByDefinitionMap {
  if (!plants || plants.length === 0) {
    return {}
  }

  return plants.reduce((groups, plant) => {
    const key = String(plant.definition.id)

    if (!groups[key]) {
      groups[key] = { plants: [plant], definition: plant.definition }
    } else if (!groups[key].plants) {
      groups[key].plants = [plant]
    } else {
      groups[key].plants.push(plant)
    }

    return groups
  }, {} as PlantsByDefinitionMap)
}

function plantFullText(plant: PlantWithDefinition) {
  return `${plant.nickname}${plant.definition.commonName}${plant.definition.scientificName}`.toLowerCase()
}

export function fullsearchPlants(term: string, plants: PlantWithDefinition[]): PlantWithDefinition[] {
  return plants
    .map((p) => ({
      ...p,
      weight: [...plantFullText(p).matchAll(new RegExp(term, 'ig'))].length
    }))
    .filter((p) => p.weight > 0)
    .toSorted((a, b) => a.weight - b.weight)
    .map(({ weight: _, ...plant }) => plant)
}
