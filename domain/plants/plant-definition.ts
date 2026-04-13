import type { WaterProfile } from "./water/water-profile"
import type { LightLevel } from "./light/light-level"
import type { SoilType } from "./soil/soil-type"
import type { PlantCategory } from "./category/plant-category"
import { PetToxicity } from "./toxicity/pet-toxicity"
import { PlantDefinitionImage } from "./plant-image"

export interface PlantDefinition {
    id: number | null

    commonName: string
    scientificName: string

    waterProfile: WaterProfile
    lightLevel: LightLevel
    soilType: SoilType
    petToxicity: PetToxicity
    petToxicityNotes: string

    categories: PlantCategory[]
    images: Omit<PlantDefinitionImage, 'plantDefinitionId'>[]

    createdAt?: string
    updatedAt?: string
}
