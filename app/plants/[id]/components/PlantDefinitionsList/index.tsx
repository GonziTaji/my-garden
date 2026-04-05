import { PlantDefinition } from "@/domain/plants/plant-definition";
import Link from "next/link";

export interface PlantDefinitionsListProps {
    definitionsList: PlantDefinition[]
}

export default function PlantDefinitionsList({ definitionsList }: PlantDefinitionsListProps) {
    return (
        <nav>
            <ul>
                {definitionsList.map((d) => (
                    <li key={d.id}>
                        <Link href={d.id.toString()}>
                            <span>{d.commonName}</span>
                            <small>{d.scientificName}</small>
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    )
}
