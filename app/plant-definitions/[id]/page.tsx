import { notFound } from 'next/navigation'
import type { PlantDefinitionRow } from '@/db/stores/plant-definitions.store'
import plantDefinitionsService from '@/services/plant-definitions.service'
import PlantDefinitionDetails from '../components/PlantDefinitionDetails'
import DeletePlantDefinitionButton from '../components/DeletePlantDefinitionButton'
import Spacer from '@/app/components/Spacer'

export interface PlantDefinitionsClientProps {
    initialDefinitions: PlantDefinitionRow[]
}

export default async function Page({ params }: PageProps<"/plant-definitions/[id]">) {
    const { id } = await params
    const plantDefinitionId = Number(id)

    if (isNaN(plantDefinitionId)) {
        notFound()
    }

    const definitionsList = await plantDefinitionsService.list()

    const current = definitionsList.find((d) => d.id === plantDefinitionId)
    if (!current) {
        notFound()
    }

    return (
        <div>
            <PlantDefinitionDetails definition={current} />
            <Spacer space={6} />
            <DeletePlantDefinitionButton def={current} />
        </div>
    )
}
