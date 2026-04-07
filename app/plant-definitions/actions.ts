'use server'


import plantDefinitionsService, {
    ValidationError,
    UniqueConstraintError,
} from '@/services/plant-definitions.service'
import plantsService from '@/services/plants.service'
import { refresh } from 'next/cache'
import { redirect } from 'next/navigation'

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

    let plantDefinitionId = 0

    try {
        const { id } = await plantDefinitionsService.create({
            commonName,
            scientificName,
            waterProfile,
            lightLevel,
            soilType,
            categories,
        })

        plantDefinitionId = id
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

    refresh()
    redirect(`/plant-definitions/${plantDefinitionId}`)
}

export async function deletePlantDefinition(id: number): Promise<ActionResult> {
    try {
        await plantDefinitionsService.delete(id)
    } catch (error) {
        console.error('Error deleting plant definition:', error)
        return { success: false, error: 'Error inesperado al eliminar el tipo de planta' }
    }

    refresh()
    redirect('/plant-definitions')
}

export interface ActionResult {
    success: boolean
    id?: number
    error?: string
    field?: string
}

export async function createPlant(formData: FormData): Promise<ActionResult> {
    const nickname = formData.get('nickname')?.toString() ?? ''
    const plantDefinitionIdRaw = formData.get('plantDefinitionId')?.toString()
    const plantDefinitionId = plantDefinitionIdRaw ? parseInt(plantDefinitionIdRaw, 10) : NaN

    if (isNaN(plantDefinitionId)) {
        return { success: false, error: 'Debes seleccionar un tipo de planta', field: 'plantDefinitionId' }
    }

    const acquiredAt = formData.get('acquiredAt')?.toString() || undefined
    const location = formData.get('location')?.toString() || undefined
    const notes = formData.get('notes')?.toString() || undefined

    try {
        const { id } = await plantsService.create({
            nickname,
            plantDefinitionId,
            acquiredAt,
            location,
            notes,
        })

        refresh()
        return { success: true, id }
    } catch (error) {
        if (error instanceof ValidationError) {
            return { success: false, error: error.message, field: error.field }
        }
        console.error('Error creating plant:', error)
        return { success: false, error: 'Error inesperado al crear la planta' }
    }
}

export async function deletePlant(id: number): Promise<ActionResult> {
    try {
        await plantsService.delete(id)
        refresh()
        return { success: true }
    } catch (error) {
        console.error('Error deleting plant:', error)
        return { success: false, error: 'Error inesperado al eliminar la planta' }
    }
}
