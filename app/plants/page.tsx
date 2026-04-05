import plantsService from '@/services/plants.service'
import plantDefinitionsService from '@/services/plant-definitions.service'
import PlantsList from './components/PlantsList'

export default async function Page() {
    const [plants, plantDefinitions] = await Promise.all([
        plantsService.list(),
        plantDefinitionsService.list(),
    ])

    return <PlantsList plants={plants} plantDefinitions={plantDefinitions} />
}
