import { notFound } from 'next/navigation'
import type { PlantDefinitionRow } from '@/db/stores/plant-definitions.store'
import plantsService from '@/services/plants.service'
import PlantDetails from '@/ui/components/PlantDetails'
import Link from 'next/link'
import { buttonVariants } from '@/ui/classVariants/button'

export interface PlantDefinitionsClientProps {
    initialDefinitions: PlantDefinitionRow[]
}

export default async function Page({ params }: PageProps<"/plants/[plant_id]">) {
    const { plant_id } = await params
    const nPlantId = Number(plant_id)

    if (isNaN(nPlantId)) {
        notFound()
    }

    const plant = await plantsService.get(nPlantId)
    if (!plant) {
        notFound()
    }

    return (
        <div>
            <div className="flex justify-end gap-3 p-4">
                <Link
                    className={buttonVariants({ variant: 'tertiary', className: 'inline-block' })}
                    href="/catalog"
                >
                    Catalogo
                </Link>

                <Link
                    className={buttonVariants({ variant: 'tertiary', className: 'inline-block' })}
                    href={`/plants`}
                >
                    Plantas
                </Link>
            </div>

            <PlantDetails key={plant.id} plant={plant} />
        </div>
    )
}
