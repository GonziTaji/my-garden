import plantsService from "@/services/plants.service"
import { buttonVariants } from "@/ui/classVariants/button"
import PlantsList, { PlantsListProps } from "@/ui/components/PlantsList"
import Link from "next/link"

export default async function Page({ }: PageProps<"/plants">) {
    const plants = await plantsService.list()

    const byDefinition: PlantsListProps['groups'] = {}

    for (const plant of plants) {
        const current = byDefinition[plant.plantDefinition.id]

        if (current) {
            current.plants.push(plant)
        } else {
            byDefinition[plant.plantDefinition.id] = {
                definition: plant.plantDefinition,
                plants: [plant]
            }
        }
    }

    return (
        <div className="grid gap-4 p-4">
            <div className="flex justify-between">
                <div className="flex gap-4">
                    <Link href={`/`} className={buttonVariants({ variant: 'tertiary' })}>
                        Inicio
                    </Link>

                    <Link href={`/catalog`} className={buttonVariants({ variant: 'tertiary' })}>
                        Catalogo
                    </Link>
                </div>

                <Link href={`/plants/new`} className={buttonVariants({ variant: 'primary' })}>
                    Nueva planta
                </Link>
            </div>

            <PlantsList groups={byDefinition} />
        </div>
    )
}
