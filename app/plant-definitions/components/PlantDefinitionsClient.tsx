'use client'

import CreatePlantDefinitionForm from './CreatePlantDefinitionForm'
import PlantDefinitionsList from './PlantDefinitionsList'
import type { PlantDefinitionRow } from '@/db/stores/plant-definitions.store'

export interface PlantDefinitionsClientProps {
    initialDefinitions: PlantDefinitionRow[]
}

export default function PlantDefinitionsClient({ initialDefinitions }: PlantDefinitionsClientProps) {
    function handleCreated(newId: number) {
        // La pagina se refresca automaticamente via refresh()
        console.log('Tipo de planta creado con ID:', newId)
    }

    return (
        <>
            <section>
                <h2>Nuevo tipo de planta</h2>
                <CreatePlantDefinitionForm onCreated={handleCreated} />
            </section>

            <section>
                <h2>Tipos existentes</h2>
                <PlantDefinitionsList definitions={initialDefinitions} />
            </section>
        </>
    )
}
