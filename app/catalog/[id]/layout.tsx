import type { PlantDefinitionRow } from '@/db/stores/plant-definitions.store'
import { PropsWithChildren } from 'react'

export interface PlantDefinitionsClientProps {
    initialDefinitions: PlantDefinitionRow[]
}

export default async function Layout({ children }: PropsWithChildren<PageProps<"/catalog/[id]/[plant_id]">>) {
    return (
        <section className="min-h-full self-stretch">
            {children}
        </section>
    )
}
