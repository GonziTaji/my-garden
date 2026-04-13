import plantDefinitionsStore, { UpsertPlantDefinitionInput } from '@/db/stores/plant-definitions.store'
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
    petToxicityNotes: string
    categories: string[]
    images?: UpsertPlantDefinitionImagesInput
}

export interface ExistingPlantDefinitionImageInput {
    id: number
    filepath: string
    position: number
}

export interface NewPlantDefinitionImageInput {
    filepath: string
    position: number
}

export interface UpsertPlantDefinitionImagesInput {
    existingImages: ExistingPlantDefinitionImageInput[]
    newImages: NewPlantDefinitionImageInput[]
    removedImageIds: number[]
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

function buildFinalImageFilepaths(
    imagesInput?: UpsertPlantDefinitionImagesInput
): { filepath: string, position: number }[] {
    if (!imagesInput) {
        return []
    }

    const removedIds = new Set(imagesInput.removedImageIds)
    const keepExisting = imagesInput.existingImages
        .filter((image) => !removedIds.has(image.id))
        .map((image) => ({
            filepath: image.filepath,
            position: image.position,
        }))

    const newImages = imagesInput.newImages.map((image) => ({
        filepath: image.filepath,
        position: image.position,
    }))

    const mergedImages = [...keepExisting, ...newImages]
        .map((image) => ({
            filepath: image.filepath.trim(),
            position: image.position,
        }))
        .filter((image) => image.filepath.length > 0)
        .filter((image) => image.position >= 0 && image.position < 3)
        .sort((left, right) => left.position - right.position)

    const byPosition = new Map<number, { filepath: string, position: number }>()
    for (const image of mergedImages) {
        byPosition.set(image.position, image)
    }

    const finalImages = [...byPosition.values()]

    if (finalImages.length > 3) {
        throw new ValidationError('No se pueden guardar mas de 3 imagenes', 'images')
    }

    return finalImages
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
        petToxicityNotes: input.petToxicityNotes,
        images: buildFinalImageFilepaths(input.images),
    }

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

export async function getPlantDefinition(id: number): Promise<PlantDefinition | undefined> {
    return plantDefinitionsStore.getById(id)
}

export async function deletePlantDefinition(id: number): Promise<void> {
    await plantDefinitionsStore.deleteById(id)
}

export async function countPlantDefinitionImageReferences(filepath: string): Promise<number> {
    return plantDefinitionsStore.countImageReferences(filepath)
}

const plantDefinitionsService = {
    upsert: upsertPlantDefinition,
    list: listPlantDefinitions,
    get: getPlantDefinition,
    delete: deletePlantDefinition,
    countImageReferences: countPlantDefinitionImageReferences,
}

export default plantDefinitionsService
