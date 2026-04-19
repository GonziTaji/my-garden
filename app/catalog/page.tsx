import plantDefinitionsService from "@/services/plant-definitions.service"
import { buttonVariants } from "@/ui/classVariants/button"
import DefinitionsCatalog from "@/ui/components/DefinitionsCatalog"
import Link from "next/link"

export default async function PlantDefinitionsPage() {
    const definitionsList = await plantDefinitionsService.list()

    return (
        <div>
            <div className="p-4 flex justify-between">
                <div className="flex gap-4">
                    <Link href={`/`} className={buttonVariants({ variant: 'tertiary' })}>
                        Inicio
                    </Link>

                    <Link href={`/plants`} className={buttonVariants({ variant: 'tertiary' })}>
                        Plantas
                    </Link>
                </div>

                <Link href={`/plants/new`} className={buttonVariants({ variant: 'primary' })}>
                    Agregar
                </Link>
            </div>

            <DefinitionsCatalog list={definitionsList} />
        </div>
    )
}
