import { notFound } from 'next/navigation'
import type { PlantDefinitionRow } from '@/db/stores/plant-definitions.store'
import plantDefinitionsService from '@/services/plant-definitions.service'
import plantsService from '@/services/plants.service'
import styles from './layout.module.css'
import { PropsWithChildren } from 'react'
import PlantDefinitionNav from '../components/PlantDefinitionNav'
import Spacer from '@/app/components/Spacer'

export interface PlantDefinitionsClientProps {
    initialDefinitions: PlantDefinitionRow[]
}

export default async function Layout({ children, params }: PropsWithChildren<PageProps<"/plant-definitions/[id]/[plant_id]">>) {
    const { id, plant_id } = await params
    const plantDefinitionId = Number(id)

    console.log(plant_id)

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
        <section className={styles.content}>
            <PlantDefinitionNav plantDefinitionId={plantDefinitionId} plants={plantsOfDef} />
            <Spacer space={2} />
            {children}
        </section>
    )
}
