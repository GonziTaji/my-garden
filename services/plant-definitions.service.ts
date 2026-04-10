import plantDefinitionsStore, { UpsertPlantDefinitionInput, PlantDefinitionRow } from '@/db/stores/plant-definitions.store'
import { waterProfile, WaterProfile } from '@/domain/plants/water/water-profile'
import { lightLevel, LightLevel } from '@/domain/plants/light/light-level'
import { soilType, SoilType } from '@/domain/plants/soil/soil-type'
import { plantCategory, PlantCategory } from '@/domain/plants/category/plant-category'
import { PlantDefinition } from '@/domain/plants/plant-definition'
import { petToxicity, PetToxicity } from '@/domain/plants/toxicity/pet-toxicity'

export interface UpsertPlantDefinitionServiceInput {
    id: number | null
    commonName: string
    scientificName: string
    waterProfile: string
    lightLevel: string
    soilType: string
    petToxicity: string
    symptoms: string
    categories: string[]
}

export class ValidationError extends Error {
    constructor(
        message: string,
        public field?: string
    ) {
        super(message)
        this.name = 'ValidationError'
    }
}

export class UniqueConstraintError extends Error {
    constructor(
        message: string,
        public field: string
    ) {
        super(message)
        this.name = 'UniqueConstraintError'
    }
}

function validateCommonName(value: string): string {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
        throw new ValidationError('El nombre comun es requerido', 'commonName')
    }
    return trimmed
}

function validateScientificName(value: string): string {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
        throw new ValidationError('El nombre cientifico es requerido', 'scientificName')
    }
    return trimmed
}

function validateWaterProfile(value: string): WaterProfile {
    if (!waterProfile.values.includes(value as WaterProfile)) {
        throw new ValidationError(
            `Perfil de agua invalido: ${value}. Valores validos: ${waterProfile.values.join(', ')}`,
            'waterProfile'
        )
    }
    return value as WaterProfile
}

function validateLightLevel(value: string): LightLevel {
    if (!lightLevel.values.includes(value as LightLevel)) {
        throw new ValidationError(
            `Nivel de luz invalido: ${value}. Valores validos: ${lightLevel.values.join(', ')}`,
            'lightLevel'
        )
    }
    return value as LightLevel
}

function validateSoilType(value: string): SoilType {
    if (!soilType.values.includes(value as SoilType)) {
        throw new ValidationError(
            `Tipo de suelo invalido: ${value}. Valores validos: ${soilType.values.join(', ')}`,
            'soilType'
        )
    }
    return value as SoilType
}

function validateCategories(values: string[]): PlantCategory[] {
    const validCategories: PlantCategory[] = []
    for (const value of values) {
        if (!plantCategory.values.includes(value as PlantCategory)) {
            throw new ValidationError(
                `Categoria invalida: ${value}. Valores validos: ${plantCategory.values.join(', ')}`,
                'categories'
            )
        }
        validCategories.push(value as PlantCategory)
    }
    return validCategories
}

function validatePetToxicity(value: string): PetToxicity {
    if (!petToxicity.values.includes(value as PetToxicity)) {
        throw new ValidationError(
            `Toxicidad invalida: ${value}. Valores validos: ${petToxicity.values.join(', ')}`,
            'petToxicity'
        )
    }

    return value as PetToxicity
}

function isUniqueConstraintError(error: unknown): boolean {
    return error instanceof Error && error.message.includes('UNIQUE constraint failed')
}

export async function upsertPlantDefinition(
    input: UpsertPlantDefinitionServiceInput
): Promise<{ id: number }> {
    const validatedInput: UpsertPlantDefinitionInput = {
        id: input.id,
        commonName: validateCommonName(input.commonName),
        scientificName: validateScientificName(input.scientificName),
        waterProfile: validateWaterProfile(input.waterProfile),
        lightLevel: validateLightLevel(input.lightLevel),
        soilType: validateSoilType(input.soilType),
        categories: validateCategories(input.categories),
        petToxicity: validatePetToxicity(input.petToxicity),
        petToxicityNotes: input.symptoms,
    }

    console.log({ validatedInput })

    try {
        if (validatedInput.id) {
            const result = await plantDefinitionsStore.update(validatedInput)
            return { id: result.id! }
        }

        const result = await plantDefinitionsStore.create(validatedInput)
        return { id: result.id! }

    } catch (error) {
        if (isUniqueConstraintError(error)) {
            throw new UniqueConstraintError(
                'Ya existe un tipo de planta con ese nombre cientifico',
                'scientificName'
            )
        }
        throw error
    }
}

export async function listPlantDefinitions(): Promise<PlantDefinition[]> {
    return plantDefinitionsStore.listAll()
}

export async function getPlantDefinition(id: number): Promise<PlantDefinitionRow | undefined> {
    return plantDefinitionsStore.getById(id)
}

export async function deletePlantDefinition(id: number): Promise<void> {
    await plantDefinitionsStore.deleteById(id)
}

const plantDefinitionsService = {
    upsert: upsertPlantDefinition,
    list: listPlantDefinitions,
    get: getPlantDefinition,
    delete: deletePlantDefinition,
}

export default plantDefinitionsService
