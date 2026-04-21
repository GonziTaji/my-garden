'use server'

import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import plantDefinitionsService, {
    ExistingPlantDefinitionImageInput,
    NewPlantDefinitionImageInput,
    UniqueConstraintError,
    ValidationError,
} from '@/services/plant-definitions.service'
import plantsService from '@/services/plants.service'
import journalService, { ValidationError as JournalValidationError } from '@/services/journal.service'
import { refresh } from 'next/cache'
import { redirect } from 'next/navigation'

export interface ActionResult {
    success: boolean
    id?: number
    error?: string
    field?: string
}

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024
const MAX_IMAGE_COUNT = 3
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const UPLOADS_DIR_ABSOLUTE = path.join(process.cwd(), 'public', 'uploads', 'plant-definitions')
const UPLOADS_DIR_PUBLIC = '/uploads/plant-definitions'

function validateImageFile(file: File): string {
    const mimeType = file.type.toLowerCase()
    const extension = path.extname(file.name).toLowerCase()

    if (!mimeType.startsWith('image/')) {
        throw new ValidationError('Solo se permiten archivos de imagen', 'images')
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
        throw new ValidationError('Formato de imagen no permitido (usar JPG, PNG o WEBP)', 'images')
    }

    if (!ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
        throw new ValidationError('Extension de imagen no permitida (usar .jpg, .jpeg, .png o .webp)', 'images')
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
        throw new ValidationError('Cada imagen debe pesar maximo 8MB', 'images')
    }

    return extension
}

async function uploadPlantDefinitionImage(file: File): Promise<string> {
    const extension = validateImageFile(file)
    await mkdir(UPLOADS_DIR_ABSOLUTE, { recursive: true })

    const filename = `${Date.now()}-${randomUUID()}${extension}`
    const targetPath = path.join(UPLOADS_DIR_ABSOLUTE, filename)
    const buffer = Buffer.from(await file.arrayBuffer())

    await writeFile(targetPath, buffer)

    return `${UPLOADS_DIR_PUBLIC}/${filename}`
}

async function removeUploadedFiles(filepaths: string[]): Promise<void> {
    for (const filepath of new Set(filepaths)) {
        if (!filepath.startsWith(UPLOADS_DIR_PUBLIC)) {
            continue
        }

        const publicRelativePath = filepath.replace(/^\//, '')
        const absolutePath = path.join(process.cwd(), 'public', publicRelativePath)

        try {
            await unlink(absolutePath)
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                console.error('Error cleaning uploaded image file:', error)
            }
        }
    }
}

async function removeUnusedFiles(filepaths: string[]): Promise<void> {
    for (const filepath of new Set(filepaths)) {
        if (!filepath.startsWith(UPLOADS_DIR_PUBLIC)) {
            continue
        }

        const references = await plantDefinitionsService.countImageReferences(filepath)
        if (references > 0) {
            continue
        }

        const publicRelativePath = filepath.replace(/^\//, '')
        const absolutePath = path.join(process.cwd(), 'public', publicRelativePath)

        try {
            await unlink(absolutePath)
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                console.error('Error deleting unused image file:', error)
            }
        }
    }
}

export async function upsertPlantDefinition(formData: FormData): Promise<ActionResult> {
    const inputId = Number(formData.get('id')) || null
    const commonName = formData.get('commonName')?.toString() ?? ''
    const scientificName = formData.get('scientificName')?.toString() ?? ''
    const categoriesRaw = formData.getAll('categories')
    const waterProfile = formData.get('waterProfile')?.toString() ?? ''
    const lightLevel = formData.get('lightLevel')?.toString() ?? ''
    const soilType = formData.get('soilType')?.toString() ?? ''
    const petToxicity = formData.get('petToxicity')?.toString() ?? ''
    const petToxicityNotes = formData.get('symptoms')?.toString() ?? ''
    const categories = categoriesRaw.map((c) => c.toString())

    const uploadedFilepaths: string[] = []
    const removedFilepaths: string[] = []
    let plantDefinitionId = 0

    try {
        const existingImages: ExistingPlantDefinitionImageInput[] = []
        const newImages: NewPlantDefinitionImageInput[] = []
        const removedImageIds: number[] = []

        const currentDefinition = inputId
            ? await plantDefinitionsService.get(inputId)
            : undefined

        if (inputId && !currentDefinition) {
            return { success: false, error: 'Tipo de planta no encontrado' }
        }

        const currentImagesById = new Map((currentDefinition?.images ?? []).map((image) => [image.id, image]))

        const ids = formData.getAll('imagesExistingId')
        const removeds = formData.getAll('imagesIsRemoved')
        const files = formData.getAll("imagesFile")

        for (let i = 0; i < MAX_IMAGE_COUNT; i++) {
            const existingId = ids[i]?.toString() ?? ''
            const file = files[i]
            const isFileValid = file instanceof File && file.size > 0

            if (existingId) {
                const existingImage = currentImagesById.get(Number(existingId))

                if (!existingImage) {
                    throw new ValidationError('Imagen existente invalida para este tipo de planta', 'images')
                }

                if (isFileValid) {
                    const filepath = await uploadPlantDefinitionImage(file)
                    uploadedFilepaths.push(filepath)
                    removedImageIds.push(existingImage.id!)
                    removedFilepaths.push(existingImage.filepath)
                    newImages.push({ filepath, position: i })
                    continue
                }

                if (removeds[i] === 'true') {
                    removedImageIds.push(existingImage.id!)
                    removedFilepaths.push(existingImage.filepath)
                    continue
                }

                existingImages.push({
                    id: existingImage.id!,
                    filepath: existingImage.filepath,
                    position: i,
                })

                continue
            }

            if (isFileValid) {
                const filepath = await uploadPlantDefinitionImage(file)
                uploadedFilepaths.push(filepath)
                newImages.push({ filepath, position: i })
            }
        }

        if ((existingImages.length + newImages.length) > MAX_IMAGE_COUNT) {
            throw new ValidationError('No se pueden guardar mas de 3 imagenes', 'images')
        }

        const { id } = await plantDefinitionsService.upsert({
            id: inputId,
            commonName,
            scientificName,
            waterProfile,
            lightLevel,
            soilType,
            categories,
            petToxicityNotes,
            petToxicity,
            images: {
                existingImages,
                newImages,
                removedImageIds,
            },
        })

        plantDefinitionId = id
        await removeUnusedFiles(removedFilepaths)
    } catch (error) {
        if (uploadedFilepaths.length > 0) {
            await removeUploadedFiles(uploadedFilepaths)
        }

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
    redirect(`/catalog/${plantDefinitionId}`)
}

export const createPlantDefinition = upsertPlantDefinition

export async function deletePlantDefinition(id: number): Promise<ActionResult> {
    try {
        await plantDefinitionsService.delete(id)
    } catch (error) {
        console.error('Error deleting plant definition:', error)
        return { success: false, error: 'Error inesperado al eliminar el tipo de planta' }
    }

    refresh()
    redirect('/catalog')
}

export async function upsertPlant(formData: FormData): Promise<ActionResult> {
    const nickname = formData.get('nickname')?.toString() ?? ''
    const plantDefinitionIdRaw = formData.get('plantDefinitionId')?.toString()
    const plantDefinitionId = plantDefinitionIdRaw ? parseInt(plantDefinitionIdRaw, 10) : NaN

    if (isNaN(plantDefinitionId)) {
        return { success: false, error: 'Debes seleccionar un tipo de planta', field: 'plantDefinitionId' }
    }

    const acquiredAt = formData.get('acquiredAt')?.toString() || ''
    let plantId = formData.get('id')?.toString()
    const location = formData.get('location')?.toString() || ''
    const notes = formData.get('notes')?.toString() || ''
    const source = formData.get('source')?.toString() || ''

    try {
        const { id } = await plantsService.create({
            id: plantId,
            nickname,
            source,
            plantDefinitionId,
            acquiredAt,
            location,
            notes,
        })

        plantId = String(id)
    } catch (error) {
        if (error instanceof ValidationError) {
            return { success: false, error: error.message, field: error.field }
        }
        console.error('Error creating plant:', error)
        return { success: false, error: 'Error inesperado al crear la planta' }
    }

    redirect(`/catalog/${plantDefinitionId}/plants/${plantId}`)
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

export async function waterPlants(formData: FormData): Promise<void> {
    const plantIdsJson = formData.get('plantIds')?.toString() ?? '[]'

    let plantIds: number[]
    try {
        plantIds = JSON.parse(plantIdsJson) as number[]
    } catch {
        return
    }

    if (plantIds.length === 0) {
        return
    }

    try {
        await journalService.waterPlants(plantIds)
        refresh()
    } catch (error) {
        console.error('Error watering plants:', error)
    }
}

export async function toggleWatering(
    plantId: number,
    date: string
): Promise<{ success: boolean; watered: boolean }> {
    try {
        const result = await journalService.toggleWateringForPlant(plantId, date)
        refresh()
        return { success: true, watered: result.watered }
    } catch (error) {
        console.error('Error toggling watering:', error)
        return { success: false, watered: false }
    }
}
