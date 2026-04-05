'use client'

import { PlantDefinition } from "@/domain/plants/plant-definition";
import Link from "next/link";
import { useParams } from "next/navigation";

export interface PlantDefinitionsListProps {
    definitionsList: PlantDefinition[]
}

export default function PlantDefinitionsList({ definitionsList }: PlantDefinitionsListProps) {
    const { id } = useParams<{ id: string }>()

    const nId = Number(id)

    return (
        <nav>
            <ul>
                {definitionsList.map((d) => (
                    <li key={d.id}>
                        {d.id === nId ? (
                            <strong>
                                <span>{d.commonName}</span>
                                <small>{d.scientificName}</small>
                            </strong>
                        ) : (
                            <Link href={`/plant-definitions/${d.id.toString()}`}>
                                <span>{d.commonName}</span>
                                <small>{d.scientificName}</small>
                            </Link>
                        )}
                    </li>
                ))}
            </ul>
        </nav>
    )
}
