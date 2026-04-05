'use server'

import plantDefinitionsService, {
    ValidationError,
    UniqueConstraintError,
} from '@/services/plant-definitions.service'
import { refresh } from 'next/cache'

export interface ActionResult {
    success: boolean
    id?: number
    error?: string
    field?: string
}

export async function createPlantDefinition(formData: FormData): Promise<ActionResult> {
    const commonName = formData.get('commonName')?.toString() ?? ''
    const scientificName = formData.get('scientificName')?.toString() ?? ''
    const waterProfile = formData.get('waterProfile')?.toString() ?? ''
    const lightLevel = formData.get('lightLevel')?.toString() ?? ''
    const soilType = formData.get('soilType')?.toString() ?? ''
    const categoriesRaw = formData.getAll('categories')
    const categories = categoriesRaw.map((c) => c.toString())

    try {
        const { id } = await plantDefinitionsService.create({
            commonName,
            scientificName,
            waterProfile,
            lightLevel,
            soilType,
            categories,
        })

        refresh()
        return { success: true, id }
    } catch (error) {
        if (error instanceof ValidationError) {
            return { success: false, error: error.message, field: error.field }
        }
        if (error instanceof UniqueConstraintError) {
            return { success: false, error: error.message, field: error.field }
        }
        console.error('Error creating plant definition:', error)
        return { success: false, error: 'Error inesperado al crear el tipo de planta' }
    }
}

export async function deletePlantDefinition(id: number): Promise<ActionResult> {
    try {
        await plantDefinitionsService.delete(id)
        refresh()
        return { success: true }
    } catch (error) {
        console.error('Error deleting plant definition:', error)
        return { success: false, error: 'Error inesperado al eliminar el tipo de planta' }
    }
}
