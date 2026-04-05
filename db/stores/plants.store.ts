import { db } from '../connect'

export interface CreatePlantInput {
    nickname: string
    plantDefinitionId: number
    acquiredAt?: string
    location?: string
    notes?: string
}

export interface PlantRow {
    id: number
    nickname: string
    plantDefinitionId: number
    acquiredAt: string | null
    location: string | null
    notes: string | null
    createdAt: string
    updatedAt: string
}

export interface PlantWithDefinition {
    id: number
    nickname: string
    acquiredAt: string | null
    location: string | null
    notes: string | null
    createdAt: string
    updatedAt: string
    plantDefinition: {
        id: number
        commonName: string
        scientificName: string
    }
}

async function create(input: CreatePlantInput) {
    return db
        .insertInto('plants')
        .values({
            nickname: input.nickname,
            plantDefinitionId: input.plantDefinitionId,
            acquiredAt: input.acquiredAt ?? null,
            location: input.location ?? null,
            notes: input.notes ?? null,
        })
        .returning('id')
        .executeTakeFirstOrThrow()
}

async function listAll(): Promise<PlantWithDefinition[]> {
    const rows = await db
        .selectFrom('plants')
        .innerJoin('plantDefinitions', 'plantDefinitions.id', 'plants.plantDefinitionId')
        .select([
            'plants.id',
            'plants.nickname',
            'plants.acquiredAt',
            'plants.location',
            'plants.notes',
            'plants.createdAt',
            'plants.updatedAt',
            'plantDefinitions.id as definitionId',
            'plantDefinitions.commonName',
            'plantDefinitions.scientificName',
        ])
        .orderBy('plants.nickname', 'asc')
        .execute()

    return rows.map((row) => ({
        id: row.id,
        nickname: row.nickname,
        acquiredAt: row.acquiredAt,
        location: row.location,
        notes: row.notes,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        plantDefinition: {
            id: row.definitionId,
            commonName: row.commonName,
            scientificName: row.scientificName,
        },
    }))
}

async function getById(id: number): Promise<PlantWithDefinition | undefined> {
    const row = await db
        .selectFrom('plants')
        .innerJoin('plantDefinitions', 'plantDefinitions.id', 'plants.plantDefinitionId')
        .select([
            'plants.id',
            'plants.nickname',
            'plants.acquiredAt',
            'plants.location',
            'plants.notes',
            'plants.createdAt',
            'plants.updatedAt',
            'plantDefinitions.id as definitionId',
            'plantDefinitions.commonName',
            'plantDefinitions.scientificName',
        ])
        .where('plants.id', '=', id)
        .executeTakeFirst()

    if (!row) return undefined

    return {
        id: row.id,
        nickname: row.nickname,
        acquiredAt: row.acquiredAt,
        location: row.location,
        notes: row.notes,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        plantDefinition: {
            id: row.definitionId,
            commonName: row.commonName,
            scientificName: row.scientificName,
        },
    }
}

async function deleteById(id: number) {
    return db
        .deleteFrom('plants')
        .where('id', '=', id)
        .execute()
}

const plantsStore = {
    create,
    listAll,
    getById,
    deleteById,
}

export default plantsStore
