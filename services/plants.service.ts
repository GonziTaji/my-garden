import plantsStore, { CreatePlantInput, PlantWithDefinition } from '@/db/stores/plants.store'
import plantDefinitionsStore from '@/db/stores/plant-definitions.store'
import { waterProfile, WaterProfile } from '@/domain/plants/water/water-profile'

export interface CreatePlantServiceInput {
    nickname: string
    plantDefinitionId: number
    acquiredAt?: string
    location?: string
    notes?: string
    overridesWaterProfile?: string
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

function validateNickname(value: string): string {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
        throw new ValidationError('El nombre de la planta es requerido', 'nickname')
    }
    return trimmed
}

function validateOverridesWaterProfile(value: string | undefined): WaterProfile | undefined {
    if (!value) return undefined
    if (!waterProfile.values.includes(value as WaterProfile)) {
        throw new ValidationError(
            `Perfil de agua invalido: ${value}. Valores validos: ${waterProfile.values.join(', ')}`,
            'overridesWaterProfile'
        )
    }
    return value as WaterProfile
}

export async function createPlant(input: CreatePlantServiceInput): Promise<{ id: number }> {
    const validatedNickname = validateNickname(input.nickname)

    // Verificar que el plantDefinitionId existe
    const definitionExists = await plantDefinitionsStore.existsById(input.plantDefinitionId)
    if (!definitionExists) {
        throw new ValidationError(
            'El tipo de planta seleccionado no existe',
            'plantDefinitionId'
        )
    }

    const createInput: CreatePlantInput = {
        nickname: validatedNickname,
        plantDefinitionId: input.plantDefinitionId,
        acquiredAt: input.acquiredAt,
        location: input.location?.trim() || undefined,
        notes: input.notes?.trim() || undefined,
        overridesWaterProfile: validateOverridesWaterProfile(input.overridesWaterProfile),
    }

    const result = await plantsStore.create(createInput)
    return { id: result.id! }
}

export async function listPlants(): Promise<PlantWithDefinition[]> {
    return plantsStore.listAll()
}

export async function getPlant(id: number): Promise<PlantWithDefinition | undefined> {
    return plantsStore.getById(id)
}

export async function deletePlant(id: number): Promise<void> {
    await plantsStore.deleteById(id)
}

const plantsService = {
    create: createPlant,
    list: listPlants,
    get: getPlant,
    delete: deletePlant,
}

export default plantsService
