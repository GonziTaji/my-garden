import plantsService from "@/services/plants.service"
import Link from "next/link"
import { notFound } from "next/navigation"
import { buttonVariants } from "@/ui/classVariants/button"
import { cn } from "@sglara/cn"

export default async function Page({ params }: PageProps<"/catalog/[id]/plants">) {
    const { id } = await params
    const plantDefinitionId = Number(id)

    if (isNaN(plantDefinitionId)) {
        notFound()
    }

    const plants = await plantsService.list({ plantDefinitionId: Number(id) })

    const definition = plants[0].plantDefinition

    return (
        <div className="px-12 grid gap-8">
            <div>
                <hr className="text-olive-600/40 my-4" />
                <Link className="flex flex-col items-center" href={`/catalog/${id}`}>
                    <span className="text-4xl">{definition.commonName}</span>
                    <span className="text-2xl italic">{definition.scientificName}</span>
                </Link>
                <hr className="text-olive-600/40 my-4" />
            </div>

            <div className="justify-self-end">
                <Link href={`/catalog/${id}/plants/new`} className={buttonVariants({ variant: 'primary', className: 'inline-block' })}>
                    Nueva planta
                </Link>
            </div>

            <nav>
                <ul>
                    {plants.map((p, i) => (
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
        </div >
    )
}
