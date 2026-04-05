import plantsService from '@/services/plants.service'
import plantDefinitionsService from '@/services/plant-definitions.service'
import { notFound } from 'next/navigation'
import PlantDetail from './components/plant-detail'
import PlantDefinitionsList from './components/PlantDefinitionsList'

export default async function Page({ params }: PageProps<'/plants/[id]'>) {
    const { id } = await params
    const plantId = Number(id)

    if (isNaN(plantId)) {
        notFound()
    }

    const plant = await plantsService.get(plantId)

    if (!plant) {
        notFound()
    }

    const definitionsList = await plantDefinitionsService.list()

    // TODO: Handle no definition for existing plant? should never happen...
    const definition = definitionsList.find((d) => d.id === plant.plantDefinition.id)!

    return (
        <div>
            <PlantDefinitionsList definitionsList={definitionsList} />
            <PlantDetail plant={plant} definition={definition} />
        </div>
    )
}
