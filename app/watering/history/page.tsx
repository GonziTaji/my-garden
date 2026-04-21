import plantsService from '@/services/plants.service'
import journalService from '@/services/journal.service'
import WateringHistoryGrid from '@/ui/components/WateringHistoryGrid'

function generateDateRange(daysBack: number, daysForward: number): string[] {
    const dates: string[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = -daysBack; i <= daysForward; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        dates.push(date.toISOString().split('T')[0])
    }

    return dates
}

export default async function Page() {
    const plants = await plantsService.list()
    const dates = generateDateRange(7, 7)

    const startDate = dates[0] + 'T00:00:00.000Z'
    const endDate = dates[dates.length - 1] + 'T23:59:59.999Z'

    const plantIds = plants.map((p) => p.id)
    const wateredMap = await journalService.getWateringHistoryByDateRange(plantIds, startDate, endDate)

    return (
        <WateringHistoryGrid plants={plants} dates={dates} wateredMap={wateredMap} />
    )
}