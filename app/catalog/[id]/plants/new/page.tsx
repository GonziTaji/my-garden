import type { PlantDefinitionRow } from '@/db/stores/plant-definitions.store'
import PlantForm from '@/ui/components/PlantForm'

export interface PlantDefinitionsClientProps {
    initialDefinitions: PlantDefinitionRow[]
}

export default async function Page({ params }: PageProps<"/catalog/[id]/new-plant">) {
    const { id } = await params

    return (
        <PlantForm plantDefinitionId={Number(id)} />
    )
}
