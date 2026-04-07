'use client'

import { PlantDefinition } from "@/domain/plants/plant-definition";
import { useParams, usePathname } from "next/navigation";
import BaseNav from "@/app/components/BaseNav";

export interface PlantDefinitionsListProps {
    definitionsList: PlantDefinition[]
}

const NEW_PLANT_DEF_FORM_URI = '/plant-definitions/new'

export default function PlantDefinitionsList({ definitionsList }: PlantDefinitionsListProps) {
    const { id } = useParams<{ id: string }>()
    const pathName = usePathname()

    const nId = Number(id)

    const items = definitionsList.map((d) => ({
        href: `/plant-definitions/${d.id}`,
        isCurrent: d.id === nId,
        label: d.commonName,
    }))

    items.push({
        href: NEW_PLANT_DEF_FORM_URI,
        isCurrent: pathName === NEW_PLANT_DEF_FORM_URI,
        label: 'Nueva',
    })

    return <BaseNav items={items} />
}
