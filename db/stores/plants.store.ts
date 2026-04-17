import { db } from '../connect'

export interface UpsertPlantInput {
    id?: string
    nickname: string
    source: string
    plantDefinitionId: number
    acquiredAt?: string
    location?: string
    notes?: string
}

export interface PlantListFilters {
    plantDefinitionId: PlantRow['plantDefinitionId']
}

export interface PlantRow {
    id: number
    nickname: string
    source: string | null
    plantDefinitionId: number
    acquiredAt: string | null
    location: string | null
    notes: string | null
    createdAt: string
    updatedAt: string
}

export interface PlantWithDefinition extends Omit<PlantRow, 'plantDefinitionId'> {
    plantDefinition: {
        id: number
        commonName: string
        scientificName: string
    }
}

async function upsert(input: UpsertPlantInput) {
    return db
        .insertInto('plants')
        .values({
            nickname: input.nickname,
            source: input.source,
            plantDefinitionId: input.plantDefinitionId,
            acquiredAt: input.acquiredAt ?? null,
            location: input.location ?? null,
            notes: input.notes ?? null,
        })
        .returning('id')
        .executeTakeFirstOrThrow()
}

async function listAll(filters?: PlantListFilters): Promise<PlantWithDefinition[]> {
    let query = db
        .selectFrom('plants')
        .innerJoin('plantDefinitions', 'plantDefinitions.id', 'plants.plantDefinitionId')
        .select([
            'plants.id',
            'plants.nickname',
            'plants.source',
            'plants.acquiredAt',
            'plants.location',
            'plants.notes',
            'plants.createdAt',
            'plants.updatedAt',
            'plantDefinitions.id as definitionId',
            'plantDefinitions.commonName',
            'plantDefinitions.scientificName',
        ])

    if (filters?.plantDefinitionId) {
        query = query.where('plants.plantDefinitionId', '=', filters.plantDefinitionId)
    }

    query = query.orderBy('plants.nickname', 'asc')

    const rows = await query.execute()

    return rows.map((row) => ({
        id: row.id,
        nickname: row.nickname,
        source: row.source,
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
            'plants.source',
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
        source: row.source,
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
    create: upsert,
    listAll,
    getById,
    deleteById,
}

export default plantsStore
