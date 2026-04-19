import type { PlantDefinitionRow } from '@/db/stores/plant-definitions.store'
import { buttonVariants } from '@/ui/classVariants/button'
import PlantForm from '@/ui/components/PlantForm'
import Link from 'next/link'

export interface PlantDefinitionsClientProps {
    initialDefinitions: PlantDefinitionRow[]
}

export default async function Page({ }: PageProps<"/plants/new">) {
    return (
        <div>
            <div className="py-8 flex gap-4">
                <Link href={`/`} className={buttonVariants({ variant: 'tertiary' })}>
                    Inicio
                </Link>

                <Link href={`/plants`} className={buttonVariants({ variant: 'tertiary' })}>
                    Lista de plantas
                </Link>
            </div>

            <PlantForm />
        </div>
    )
}
