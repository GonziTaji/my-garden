import { db } from '../connect'
import type { WaterProfile } from '@/domain/plants/water/water-profile'
import type { LightLevel } from '@/domain/plants/light/light-level'
import type { SoilType } from '@/domain/plants/soil/soil-type'
import type { PlantCategory } from '@/domain/plants/category/plant-category'
import { PlantDefinition } from '@/domain/plants/plant-definition'
import { PetToxicity } from '@/domain/plants/toxicity/pet-toxicity'
import { sql } from 'kysely'

export interface PlantDefinitionRow {
    id: number | null
    commonName: string
    scientificName: string
    waterProfile: WaterProfile
    lightLevel: LightLevel
    soilType: SoilType
    petToxicity: PetToxicity
    petToxicityNotes: string
    categories: PlantCategory[]
    createdAt: string
    updatedAt: string
}

export interface PlantDefinitionImageRow {
    id: number
    plantDefinitionId: number
    filepath: string
    position: number
}

type WithoutTimestamps<T> = Omit<T, 'createdAt' | 'updatedAt'>

export type UpsertPlantDefinitionInput = WithoutTimestamps<PlantDefinitionRow> & {
    images: { filepath: string, position: number }[]
}

async function update(input: UpsertPlantDefinitionInput) {
    return await db.transaction().execute(async (tx) => {
        await tx.updateTable('plantDefinitions')
            .where('id', '=', input.id)
            .set({
                commonName: input.commonName,
                scientificName: input.scientificName,
                waterProfile: input.waterProfile,
                lightLevel: input.lightLevel,
                soilType: input.soilType,
                petToxicity: input.petToxicity,
                petToxicityNotes: input.petToxicityNotes,
                categoriesJson: JSON.stringify(input.categories),
                updatedAt: sql`current_timestamp`,
            })
            .executeTakeFirstOrThrow()

        if (input.images) {
            const currentImages = await (tx.selectFrom('plantDefinitionsImages') as any)
                .select(['id', 'filepath', 'position'])
                .where('plantDefinitionId', '=', input.id)
                .execute() as { id: number, filepath: string, position: number }[]

            const currentImagesByFilepath = new Map(currentImages.map((img) => [img.filepath, img]))
            const nextImagesByFilepath = new Map(
                input.images
                    .map((image) => ({
                        filepath: image.filepath.trim(),
                        position: image.position,
                    }))
                    .filter((image) => image.filepath.length > 0)
                    .map((image) => [image.filepath, image])
            )

            const toInsert = [...nextImagesByFilepath.values()]
                .filter((image) => !currentImagesByFilepath.has(image.filepath))

            const toDelete = [...currentImagesByFilepath.keys()]
                .filter((filepath) => !nextImagesByFilepath.has(filepath))

            const toUpdatePosition = [...nextImagesByFilepath.values()]
                .map((image) => ({
                    current: currentImagesByFilepath.get(image.filepath),
                    next: image,
                }))
                .filter(({ current }) => !!current)
                .filter(({ current, next }) => current!.position !== next.position)

            if (toDelete.length > 0) {
                await tx.deleteFrom('plantDefinitionsImages')
                    .where('plantDefinitionId', '=', input.id)
                    .where('filepath', 'in', toDelete)
                    .execute()
            }

            if (toInsert.length > 0) {
                await tx.insertInto('plantDefinitionsImages')
                    .values(
                        toInsert.map((image) => ({
                            plantDefinitionId: input.id!,
                            filepath: image.filepath,
                            position: image.position,
                        }))
                    )
                    .execute()
            }

            for (const image of toUpdatePosition) {
                await tx
                    .updateTable('plantDefinitionsImages' as any)
                    .set({ position: image.next.position + 10 })
                    .where('id', '=', image.current!.id)
                    .executeTakeFirst()
            }

            for (const image of toUpdatePosition) {
                await tx
                    .updateTable('plantDefinitionsImages' as any)
                    .set({ position: image.next.position })
                    .where('id', '=', image.current!.id)
                    .executeTakeFirst()
            }
        }

        return { id: input.id! }
    })
}

async function create(input: UpsertPlantDefinitionInput) {
    return await db.transaction().execute(async (tx) => {
        const createdRow = await tx
            .insertInto('plantDefinitions')
            .values({
                commonName: input.commonName,
                scientificName: input.scientificName,
                waterProfile: input.waterProfile,
                lightLevel: input.lightLevel,
                soilType: input.soilType,
                petToxicity: input.petToxicity,
                petToxicityNotes: input.petToxicityNotes,
                categoriesJson: JSON.stringify(input.categories),
            })
            .returning('id')
            .executeTakeFirstOrThrow()

        if (input.images && input.images.length > 0) {
            const uniqueImagesByFilepath = new Map(
                input.images
                    .map((image) => ({
                        filepath: image.filepath.trim(),
                        position: image.position,
                    }))
                    .filter((image) => image.filepath.length > 0)
                    .map((image) => [image.filepath, image])
            )

            const images = [...uniqueImagesByFilepath.values()]
            if (images.length > 0) {
                await tx
                    .insertInto('plantDefinitionsImages')
                    .values(
                        images.map((image) => ({
                            plantDefinitionId: createdRow.id,
                            filepath: image.filepath,
                            position: image.position,
                        }))
                    )
                    .execute()
            }
        }

        return createdRow
    })
}

async function listAll(): Promise<PlantDefinition[]> {
    const rows = await db
        .selectFrom('plantDefinitions')
        .selectAll()
        .orderBy('commonName', 'asc')
        .execute()

    if (rows.length === 0) {
        return []
    }

    const plantDefinitions = rows.map((row) => ({
        id: row.id,
        commonName: row.commonName,
        scientificName: row.scientificName,
        waterProfile: row.waterProfile as WaterProfile,
        lightLevel: row.lightLevel as LightLevel,
        soilType: row.soilType as SoilType,
        petToxicity: row.petToxicity as PetToxicity,
        petToxicityNotes: row.petToxicityNotes,
        categories: JSON.parse(row.categoriesJson) as PlantCategory[],
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        images: [] as PlantDefinitionImageRow[],
    }))

    const definitionIds = plantDefinitions.map((definition) => definition.id)
    const images = await (db
        .selectFrom('plantDefinitionsImages') as any)
        .select(['id', 'plantDefinitionId', 'filepath', 'position'])
        .where('plantDefinitionId', 'in', definitionIds)
        .orderBy('plantDefinitionId', 'asc')
        .orderBy('position', 'asc')
        .execute() as { id: number, plantDefinitionId: number, filepath: string, position: number }[]

    const imagesByDefinitionId = new Map<number, PlantDefinitionImageRow[]>()

    for (const image of images) {
        const current = imagesByDefinitionId.get(image.plantDefinitionId) ?? []
        current.push({
            id: image.id,
            plantDefinitionId: image.plantDefinitionId,
            filepath: image.filepath,
            position: image.position,
        })
        imagesByDefinitionId.set(image.plantDefinitionId, current)
    }

    for (const definition of plantDefinitions) {
        definition.images = imagesByDefinitionId.get(definition.id) ?? []
    }

    return plantDefinitions
}

async function getById(id: number): Promise<PlantDefinition | undefined> {
    const row = await db
        .selectFrom('plantDefinitions')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst()

    if (!row) return undefined

    const images = await (db
        .selectFrom('plantDefinitionsImages') as any)
        .select(['id', 'plantDefinitionId', 'filepath', 'position'])
        .where('plantDefinitionId', '=', id)
        .orderBy('position', 'asc')
        .execute() as { id: number, plantDefinitionId: number, filepath: string, position: number }[]

    return {
        id: row.id,
        commonName: row.commonName,
        scientificName: row.scientificName,
        waterProfile: row.waterProfile as WaterProfile,
        lightLevel: row.lightLevel as LightLevel,
        soilType: row.soilType as SoilType,
        petToxicity: row.petToxicity as PetToxicity,
        petToxicityNotes: row.petToxicityNotes,
        categories: JSON.parse(row.categoriesJson) as PlantCategory[],
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        images: images.map((image) => ({
            id: image.id,
            plantDefinitionId: image.plantDefinitionId,
            filepath: image.filepath,
            position: image.position,
        })),
    }
}

async function deleteById(id: number) {
    return db
        .deleteFrom('plantDefinitions')
        .where('id', '=', id)
        .execute()
}

async function existsById(id: number): Promise<boolean> {
    const row = await db
        .selectFrom('plantDefinitions')
        .select('id')
        .where('id', '=', id)
        .executeTakeFirst()

    return !!row
}

async function countImageReferences(filepath: string): Promise<number> {
    const row = await db
        .selectFrom('plantDefinitionsImages')
        .select((eb) => eb.fn.count<number>('id').as('count'))
        .where('filepath', '=', filepath)
        .executeTakeFirst()

    return row?.count ?? 0
}

const plantDefinitionsStore = {
    create,
    update,
    listAll,
    getById,
    deleteById,
    existsById,
    countImageReferences,
}

export default plantDefinitionsStore
