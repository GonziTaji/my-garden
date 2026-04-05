import { db } from '../connect'
import type { WaterProfile } from '@/domain/plants/water/water-profile'
import type { LightLevel } from '@/domain/plants/light/light-level'
import type { SoilType } from '@/domain/plants/soil/soil-type'
import type { PlantCategory } from '@/domain/plants/category/plant-category'
import { PlantDefinition } from '@/domain/plants/plant-definition'

export interface CreatePlantDefinitionInput {
    commonName: string
    scientificName: string
    waterProfile: WaterProfile
    lightLevel: LightLevel
    soilType: SoilType
    categories: PlantCategory[]
}

export interface PlantDefinitionRow {
    id: number
    commonName: string
    scientificName: string
    waterProfile: WaterProfile
    lightLevel: LightLevel
    soilType: SoilType
    categories: PlantCategory[]
    createdAt: string
    updatedAt: string
}

async function create(input: CreatePlantDefinitionInput) {
    return db
        .insertInto('plantDefinitions')
        .values({
            commonName: input.commonName,
            scientificName: input.scientificName,
            waterProfile: input.waterProfile,
            lightLevel: input.lightLevel,
            soilType: input.soilType,
            categoriesJson: JSON.stringify(input.categories),
        })
        .returning('id')
        .executeTakeFirstOrThrow()
}

async function listAll(): Promise<PlantDefinition[]> {
    const rows = await db
        .selectFrom('plantDefinitions')
        .selectAll()
        .orderBy('commonName', 'asc')
        .execute()

    return rows.map((row) => ({
        id: row.id,
        commonName: row.commonName,
        scientificName: row.scientificName,
        waterProfile: row.waterProfile as WaterProfile,
        lightLevel: row.lightLevel as LightLevel,
        soilType: row.soilType as SoilType,
        categories: JSON.parse(row.categoriesJson) as PlantCategory[],
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    }))
}

async function getById(id: number): Promise<PlantDefinitionRow | undefined> {
    const row = await db
        .selectFrom('plantDefinitions')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst()

    if (!row) return undefined

    return {
        id: row.id,
        commonName: row.commonName,
        scientificName: row.scientificName,
        waterProfile: row.waterProfile as WaterProfile,
        lightLevel: row.lightLevel as LightLevel,
        soilType: row.soilType as SoilType,
        categories: JSON.parse(row.categoriesJson) as PlantCategory[],
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
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

const plantDefinitionsStore = {
    create,
    listAll,
    getById,
    deleteById,
    existsById,
}

export default plantDefinitionsStore
