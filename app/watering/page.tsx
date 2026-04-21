import plantsService from '@/services/plants.service'
import journalService from '@/services/journal.service'
import { buttonVariants } from '@/ui/classVariants/button'
import WateringList from '@/ui/components/WateringList'
import Link from 'next/link'
import { waterPlants } from '@/ui/actions/actions'

export default async function Page() {
    const plants = await plantsService.list()

    const groups: Record<string, { plants: typeof plants; definition: typeof plants[0]['plantDefinition'] }> = {}

    for (const plant of plants) {
        const current = groups[plant.plantDefinition.id]
        if (current) {
            current.plants.push(plant)
        } else {
            groups[plant.plantDefinition.id] = {
                definition: plant.plantDefinition,
                plants: [plant],
            }
        }
    }

    const plantIds = plants.map((p) => p.id)
    const lastWateredDates = await journalService.getLastWateredDates(plantIds)

    return (
        <div className="grid gap-4 p-4">
            <div className="flex justify-between">
                <div className="flex gap-4">
                    <Link href={`/`} className={buttonVariants({ variant: 'tertiary' })}>
                        Inicio
                    </Link>

                    <Link href={`/plants`} className={buttonVariants({ variant: 'tertiary' })}>
                        Mis plantas
                    </Link>

                    <Link href={`/catalog`} className={buttonVariants({ variant: 'tertiary' })}>
                        Catalogo
                    </Link>

                    <Link href={`/watering/history`} className={buttonVariants({ variant: 'tertiary' })}>
                        Historico
                    </Link>
                </div>
            </div>

            <form action={waterPlants} className="grid gap-4">
                <div className="pt-4">
                    <button type="submit" className={buttonVariants({ variant: 'primary' })}>
                        Registrar riego
                    </button>
                </div>

                <WateringList groups={groups} lastWateredDates={lastWateredDates} />
            </form>
        </div>
    )
}