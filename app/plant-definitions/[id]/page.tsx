import { notFound } from 'next/navigation'
import CreatePlantDefinitionForm from '../components/CreatePlantDefinitionForm'
import type { PlantDefinitionRow } from '@/db/stores/plant-definitions.store'
import plantDefinitionsService from '@/services/plant-definitions.service'
import plantsService from '@/services/plants.service'
import PlantDetails from '../components/PlantDetails'
import PlantDefinitionDetails from '../components/PlantDefinitionDetails'
import CreatePlantForm from '../components/CreatePlantForm'
import DeletePlantDefinitionButton from '../components/DeletePlantDefinitionButton'
import PlantDefinitionsList from '../components/PlantDefinitionsList'
import styles from './page.module.css'

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

    return (
        <div>
            <section>
                <h2>Nuevo tipo de planta</h2>
                <CreatePlantDefinitionForm />
            </section>

            <section>
                <PlantDefinitionsList definitionsList={definitionsList} />
            </section>

            <section className={styles.content} data-view-transition='left-to-right'>
                <PlantDefinitionDetails definition={current} />
                {plantsOfDef.map((plant) => (
                    <PlantDetails plant={plant} />
                ))}

                <CreatePlantForm plantDefinitionId={current.id} />

                <DeletePlantDefinitionButton def={current} />

            </section>
        </div>
    )
}
