import { db } from '../connect'

export type JournalEntryType = 'watering' | 'fertilizing' | 'repotting' | 'note'

export interface CreateJournalEntryInput {
    plantId: number
    type: JournalEntryType
    scheduledFor?: string
}

export interface JournalEntryWithPlant {
    id: number
    plantId: number
    type: JournalEntryType
    entryCreatedAt: string
    entryUpdatedAt: string
    plant: {
        id: number
        nickname: string
        plantDefinition: {
            id: number
            commonName: string
            scientificName: string
        }
    }
}

async function createWatering(input: CreateJournalEntryInput) {
    return db
        .insertInto('plantJournalEntries')
        .values({
            plantId: input.plantId,
            journalEntryType: input.type,
            entryCreatedAt: input.scheduledFor ?? new Date().toISOString(),
        })
        .returning('id')
        .executeTakeFirstOrThrow()
}

async function createWateringBulk(plantIds: number[]): Promise<{ id: number }[]> {
    const entries = plantIds.map((plantId) => ({
        plantId: plantId,
        journalEntryType: 'watering' as JournalEntryType,
    }))

    return db
        .insertInto('plantJournalEntries')
        .values(entries)
        .returning('id')
        .execute()
}

async function listByPlant(plantId: number): Promise<JournalEntryWithPlant[]> {
    const rows = await db
        .selectFrom('plantJournalEntries')
        .innerJoin('plants', 'plants.id', 'plantJournalEntries.plantId')
        .innerJoin('plantDefinitions', 'plantDefinitions.id', 'plants.plantDefinitionId')
        .select([
            'plantJournalEntries.id',
            'plantJournalEntries.plantId',
            'plantJournalEntries.journalEntryType as type',
            'plantJournalEntries.entryCreatedAt as entryCreatedAt',
            'plantJournalEntries.entryUpdatedAt as entryUpdatedAt',
            'plants.id as plantId',
            'plants.nickname',
            'plantDefinitions.id as definitionId',
            'plantDefinitions.commonName',
            'plantDefinitions.scientificName',
        ])
        .where('plantJournalEntries.plantId', '=', plantId)
        .orderBy('plantJournalEntries.entryCreatedAt', 'desc')
        .execute()

    return rows.map((row) => ({
        id: row.id,
        plantId: row.plantId,
        type: row.type as JournalEntryType,
        entryCreatedAt: row.entryCreatedAt,
        entryUpdatedAt: row.entryUpdatedAt,
        plant: {
            id: row.plantId,
            nickname: row.nickname,
            plantDefinition: {
                id: row.definitionId,
                commonName: row.commonName,
                scientificName: row.scientificName,
            },
        },
    }))
}

async function getLastWateredByPlantIds(plantIds: number[]): Promise<Map<number, string>> {
    if (plantIds.length === 0) return new Map()

    const rows = await db
        .selectFrom('plantJournalEntries')
        .select(['plantId', 'entryCreatedAt'])
        .where('plantId', 'in', plantIds)
        .where('journalEntryType', '=', 'watering')
        .orderBy('entryCreatedAt', 'desc')
        .execute()

    const result = new Map<number, string>()
    for (const row of rows) {
        if (!result.has(row.plantId)) {
            result.set(row.plantId, row.entryCreatedAt)
        }
    }

    return result
}

async function getWateringEntriesByDateRange(
    plantIds: number[],
    startDate: string,
    endDate: string
): Promise<Map<number, Set<string>>> {
    if (plantIds.length === 0) return new Map()

    const rows = await db
        .selectFrom('plantJournalEntries')
        .select(['plantId', 'entryCreatedAt'])
        .where('plantId', 'in', plantIds)
        .where('journalEntryType', '=', 'watering')
        .where('entryCreatedAt', '>=', startDate)
        .where('entryCreatedAt', '<', endDate)
        .execute()

    const result = new Map<number, Set<string>>()
    for (const row of rows) {
        const date = row.entryCreatedAt.split('T')[0]
        let dates = result.get(row.plantId)
        if (!dates) {
            dates = new Set()
            result.set(row.plantId, dates)
        }
        dates.add(date)
    }

    return result
}

async function deleteWateringByPlantAndDate(plantId: number, date: string) {
    const dateStart = date + 'T00:00:00.000Z'
    const dateEnd = date + 'T23:59:59.999Z'

    return db
        .deleteFrom('plantJournalEntries')
        .where('plantId', '=', plantId)
        .where('journalEntryType', '=', 'watering')
        .where('entryCreatedAt', '>=', dateStart)
        .where('entryCreatedAt', '<=', dateEnd)
        .execute()
}

const journalStore = {
    createWatering,
    createWateringBulk,
    listByPlant,
    getLastWateredByPlantIds,
    getWateringEntriesByDateRange,
    deleteWateringByPlantAndDate,
}

export default journalStore