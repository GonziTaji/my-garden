import { notFound } from 'next/navigation'
import plantDefinitionsService from '@/services/plant-definitions.service'
import DefinitionView from '../../../ui/components/DefinitionView'

export default async function Page({ params, searchParams }: PageProps<"/catalog/[id]">) {
    const { id } = await params
    const plantDefinitionId = Number(id)

    if (isNaN(plantDefinitionId)) {
        notFound()
    }

    const current = await plantDefinitionsService.get(plantDefinitionId)
    if (!current) {
        notFound()
    }

    const { e } = await searchParams

    return (
        <DefinitionView record={current} editMode={e === 'T'} />
    )
}
