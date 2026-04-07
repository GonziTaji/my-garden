'use client'

import { PlantDefinition } from "@/domain/plants/plant-definition";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import styles from './styles.module.css'
import { FC, ReactNode } from "react";

export interface PlantDefinitionsListProps {
    definitionsList: PlantDefinition[]
}

interface NavItemProps {
    children?: ReactNode
    isCurrent: boolean
    href: string
}

const NavItem: FC<NavItemProps> = ({ isCurrent, href, children }) => {
    return (
        <li className={styles.navItem} data-current={isCurrent}>
            {isCurrent ? (
                <span className={styles.navItemContent}>
                    {children}
                </span>
            ) : (
                <Link href={href} className={styles.navItemContent}>
                    {children}
                </Link>
            )}
        </li>
    )
}

const NEW_PLANT_DEF_FORM_URI = '/plant-definitions/new'

export default function PlantDefinitionsList({ definitionsList }: PlantDefinitionsListProps) {
    const { id } = useParams<{ id: string }>()
    const pathName = usePathname()

    const nId = Number(id)

    const inNewPlant = pathName === NEW_PLANT_DEF_FORM_URI

    return (
        <nav className={styles.nav}>
            <ul className={styles.list}>
                {definitionsList.map((d) => (
                    <NavItem key={d.id} href={`/plant-definitions/${d.id}`} isCurrent={d.id === nId}>
                        {d.commonName}
                    </NavItem>
                ))}

                <NavItem href={NEW_PLANT_DEF_FORM_URI} isCurrent={inNewPlant}>
                    Nueva
                </NavItem>
            </ul>
        </nav>
    )
}
