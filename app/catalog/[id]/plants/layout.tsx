import Link from "next/link"
import { notFound } from "next/navigation"
import plantDefinitionsService from "@/services/plant-definitions.service"
import { PropsWithChildren } from "react"

export default async function Layout({ params, children }: PropsWithChildren<PageProps<"/catalog/[id]/plants">>) {
    const { id } = await params
    const plantDefinitionId = Number(id)

    if (isNaN(plantDefinitionId)) {
        notFound()
    }

    const definition = await plantDefinitionsService.get(plantDefinitionId)

    if (!definition) {
        notFound()
    }

    return (
        <div className="px-12">
            <div className="pb-4">
                <hr className="text-olive-600/40 my-4" />
                <Link className="flex flex-col items-center" href={`/catalog/${id}`}>
                    <span className="text-4xl">{definition.commonName}</span>
                    <span className="text-2xl italic">{definition.scientificName}</span>
                </Link>
                <hr className="text-olive-600/40 my-4" />
            </div>

            {children}
        </div >
    )
}
