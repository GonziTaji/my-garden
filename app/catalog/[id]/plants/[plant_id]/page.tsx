import { notFound } from 'next/navigation'
import type { PlantDefinitionRow } from '@/db/stores/plant-definitions.store'
import plantsService from '@/services/plants.service'
import PlantDetails from '@/app/catalog/components/PlantDetails'

export interface PlantDefinitionsClientProps {
    initialDefinitions: PlantDefinitionRow[]
}

export default async function Page({ params }: PageProps<"/catalog/[id]/[plant_id]">) {
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
        <PlantDetails key={plant.id} plant={plant} />
    )
}
