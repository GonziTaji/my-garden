import plantDefinitionsService from '@/services/plant-definitions.service'
import PlantDefinitionsList from './components/PlantDefinitionsList'

export default async function PlantDefinitionsPage() {
    const definitions = await plantDefinitionsService.list()

    return (
        <main id="plant-definitions-page">
            <h1>Tipos de plantas</h1>

            <PlantDefinitionsList definitionsList={definitions} />
        </main>
    )
}
