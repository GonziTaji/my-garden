import type { PlantDefinitionRow } from '@/db/stores/plant-definitions.store'
import CreatePlantForm from '@/app/catalog/components/CreatePlantForm'

export interface PlantDefinitionsClientProps {
    initialDefinitions: PlantDefinitionRow[]
}

export default async function Page({ params }: PageProps<"/catalog/[id]/new-plant">) {
    const { id } = await params

    return (
        <CreatePlantForm plantDefinitionId={Number(id)} />
    )
}
