import { notFound } from 'next/navigation'
import type { PlantDefinitionRow } from '@/db/stores/plant-definitions.store'
import plantDefinitionsService from '@/services/plant-definitions.service'
import plantsService from '@/services/plants.service'
import PlantDetails from '../components/PlantDetails'
import PlantDefinitionDetails from '../components/PlantDefinitionDetails'
import CreatePlantForm from '../components/CreatePlantForm'
import DeletePlantDefinitionButton from '../components/DeletePlantDefinitionButton'
import styles from './page.module.css'
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

    const plantsOfDef = await plantsService.list({ plantDefinitionId })

    console.log(plantsOfDef)

    return (
        <section className={styles.content}>
            <PlantDefinitionDetails definition={current} />
            {plantsOfDef.map((plant) => (
                <PlantDetails key={plant.id} plant={plant} />
            ))}

            <details>
                <summary>Agregar nueva planta</summary>
                <CreatePlantForm plantDefinitionId={current.id} />
            </details>

            <Spacer space={6} />

            <DeletePlantDefinitionButton className={styles.deleteButton} def={current} />
        </section>
    )
}
