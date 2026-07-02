export interface PlantDefinitionImage {
  id: number | null
  filepath: string
  plantDefinitionId: number
  position: number
}

export interface PlantImage {
  id: number | null
  plantId: number
  filepath: string
  createdAt: string
}
