'use client'

import Link from "next/link"

interface PlantDefinitionHeaderProps {
    mode: 'form' | 'link'
    commonName: string
    scientificName: string
}
export default function PlantDefinitionHeader({ commonName, scientificName }: PlantDefinitionHeaderProps) {
    return <div className="pb-4">
        <hr className="text-olive-600/40 my-4" />
        <Link className="flex flex-col items-center" href={`/catalog/${}`}>
            <span className="text-4xl">
                {commonName}
            </span>
            <span className="text-2xl italic">
                {scientificName}
            </span>
        </Link>
        <hr className="text-olive-600/40 my-4" />
    </div>
}
