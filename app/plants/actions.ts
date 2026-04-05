'use server'

import plantsService, { ValidationError } from '@/services/plants.service'
import { refresh } from 'next/cache'

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
