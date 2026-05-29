import type { PlantDefinition } from "./plant-definition"

export interface Plant {
  id: number

  nickname: string
  source?: string

  plantDefinitionId: number

  acquiredAt?: Date
  location?: string

  notes?: string
}

export type PlantWithDefinition = Plant & {
  plantDefinition: PlantDefinition
}

