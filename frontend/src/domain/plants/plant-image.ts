export interface PlantSpeciesImage {
  id: number | null
  filepath: string
  plantSpeciesId: number
  position: number
}

export interface PlantImage {
  id: number | null
  plantId: number
  filepath: string
  createdAt: string
}
