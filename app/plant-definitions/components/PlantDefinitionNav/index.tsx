'use client'
import { Plant } from "@/domain/plants/plant";
import BaseNav, { NavItem } from "@/app/components/BaseNav";
import { PlantDefinition } from "@/domain/plants/plant-definition"
import { usePathname } from "next/navigation";

export interface PlantDefinitionNavProps {
    plantDefinitionId: PlantDefinition['id'],
    plants: Pick<Plant, 'nickname' | 'id'>[]
}

export default function PlantDefinitionNav({ plantDefinitionId, plants }: PlantDefinitionNavProps) {
    const pathName = usePathname()

    console.log({ pathName })

    const navItems: NavItem[] = [
        {
            label: 'Detalles',
            href: `/plant-definitions/${plantDefinitionId}`,
            isCurrent: false
        },
        ...plants.map((p) => ({
            label: `Planta: ${p.nickname}`,
            href: `/plant-definitions/${plantDefinitionId}/${p.id}`,
            isCurrent: false
        })),
        {
            label: 'Nueva planta',
            href: `/plant-definitions/${plantDefinitionId}/new-plant`,
            isCurrent: false
        }
    ].map((item) => ({ ...item, isCurrent: pathName === item.href }))

    return <BaseNav items={navItems} />
}
