import plantsService from "@/services/plants.service"
import Link from "next/link"
import { notFound } from "next/navigation"
import { buttonVariants } from "@/ui/classVariants/button"
import { cn } from "@sglara/cn"
import plantDefinitionsService from "@/services/plant-definitions.service"

export default async function Page({ params }: PageProps<"/catalog/[id]/plants">) {
    const { id } = await params
    const plantDefinitionId = Number(id)

    if (isNaN(plantDefinitionId)) {
        notFound()
    }

    const definition = await plantDefinitionsService.get(plantDefinitionId)

    if (!definition) {
        notFound()
    }

    const plants = await plantsService.list({ plantDefinitionId })

    return (
        <div>
            <div className="justify-self-end">
                <Link href={`/catalog/${id}/plants/new`} className={buttonVariants({ variant: 'primary', className: 'inline-block' })}>
                    Nueva planta
                </Link>
            </div>

            <nav>
                <ul>
                    {plants.map((p) => (
                        <li key={p.id} className=''>
                            <Link href={`/catalog/${id}/plants/${p.id}`} className={cn(
                                'h-20 content-center'
                            )}>
                                <span className="text-2xl px-4">{p.nickname}</span>
                            </Link>
                            <hr className="text-olive-600/40 my-4" />
                        </li >
                    ))
                    }
                </ul >
            </nav >
        </div>
    )

}
