import plantDefinitionsService from '@/services/plant-definitions.service'
import PlantDefinitionsList from '../plant-definitions/components/PlantDefinitionsList'

export default async function Page() {
    const plantDefinitions = await plantDefinitionsService.list()

    return <PlantDefinitionsList definitionsList={plantDefinitions} />
}
