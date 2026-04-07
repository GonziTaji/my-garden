import type { PlantDefinitionRow } from '@/db/stores/plant-definitions.store'
import CreatePlantForm from '@/app/plant-definitions/components/CreatePlantForm'

export interface PlantDefinitionsClientProps {
    initialDefinitions: PlantDefinitionRow[]
}

export default async function Page({ params }: PageProps<"/plant-definitions/[id]/new-plant">) {
    const { id } = await params

    return (
        <CreatePlantForm plantDefinitionId={Number(id)} />
    )
}
