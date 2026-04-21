import journalStore, { CreateJournalEntryInput, JournalEntryWithPlant } from '@/db/stores/journal.store'
import plantsStore from '@/db/stores/plants.store'
import { db } from '@/db/connect'

export class ValidationError extends Error {
    constructor(
        message: string,
        public field?: string
    ) {
        super(message)
        this.name = 'ValidationError'
    }
}

async function validatePlantIds(plantIds: number[]): Promise<number[]> {
    const uniqueIds = [...new Set(plantIds)]
    const validIds: number[] = []

    for (const id of uniqueIds) {
        const plant = await plantsStore.getById(id)
        if (plant) {
            validIds.push(id)
        } else {
            throw new ValidationError(`La planta con ID ${id} no existe`, 'plantIds')
        }
    }

    return validIds
}

export async function waterPlants(plantIds: number[]): Promise<{ count: number }> {
    const validIds = await validatePlantIds(plantIds)

    if (validIds.length === 0) {
        throw new ValidationError('Debes seleccionar al menos una planta', 'plantIds')
    }

    await journalStore.createWateringBulk(validIds)
    return { count: validIds.length }
}

export async function getPlantWateringHistory(plantId: number): Promise<JournalEntryWithPlant[]> {
    return journalStore.listByPlant(plantId)
}

export async function getLastWateredDates(plantIds: number[]): Promise<Map<number, string>> {
    return journalStore.getLastWateredByPlantIds(plantIds)
}

export async function getWateringHistoryByDateRange(
    plantIds: number[],
    startDate: string,
    endDate: string
): Promise<Map<number, Set<string>>> {
    return journalStore.getWateringEntriesByDateRange(plantIds, startDate, endDate)
}

export async function toggleWateringForPlant(
    plantId: number,
    date: string
): Promise<{ watered: boolean; plantId: number; date: string }> {
    const plant = await plantsStore.getById(plantId)
    if (!plant) {
        throw new ValidationError(`La planta con ID ${plantId} no existe`, 'plantId')
    }

    const startOfDay = date + 'T00:00:00.000Z'
    const endOfDay = date + 'T23:59:59.999Z'

    const existing = await db
        .selectFrom('plantJournalEntries')
        .select('id')
        .where('plantId', '=', plantId)
        .where('journalEntryType', '=', 'watering')
        .where('entryCreatedAt', '>=', startOfDay)
        .where('entryCreatedAt', '<=', endOfDay)
        .executeTakeFirst()

    if (existing) {
        await db
            .deleteFrom('plantJournalEntries')
            .where('id', '=', existing.id)
            .execute()
        return { watered: false, plantId, date }
    }

    const input: CreateJournalEntryInput = {
        plantId,
        type: 'watering',
        scheduledFor: date + 'T12:00:00.000Z',
    }
    await journalStore.createWatering(input)
    return { watered: true, plantId, date }
}

const journalService = {
    waterPlants,
    getPlantWateringHistory,
    getLastWateredDates,
    getWateringHistoryByDateRange,
    toggleWateringForPlant,
}

export default journalService