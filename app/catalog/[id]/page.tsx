import { notFound } from 'next/navigation'
import plantDefinitionsService from '@/services/plant-definitions.service'
import DefinitionView from '../../../ui/components/DefinitionView'
import { buttonVariants } from '@/ui/classVariants/button'
import Link from 'next/link'

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
    const editMode = e === 'T'

    return (
        <div>
            <div className="py-4 flex gap-4">
                <div className="flex justify-end gap-3 p-4">
                    <Link
                        className={buttonVariants({ variant: 'tertiary' })}
                        href="/catalog"
                    >
                        Catalogo
                    </Link>

                    <Link
                        className={buttonVariants({ variant: 'tertiary' })}
                        href={`/plants`}
                    >
                        Plantas
                    </Link>
                </div>
            </div>

            <DefinitionView record={current} editMode={editMode} />
        </div>
    )
}
