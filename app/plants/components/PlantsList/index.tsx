import styles from './styles.module.css'

export interface PlantListItem {
    id: number
    alias: string
    name: string
}

interface PlantsListProps {
    plants: PlantListItem[]
}

export default function PlantsList({ plants }: PlantsListProps) {
    return (
        <main id="plants-list-page-content">
            <h1>My garden</h1>

            <section>
                <ul className="plants-list">
                    {plants.map((p) =>
                        <li key={p.id}>
                            <details>
                                <summary className={styles.plantItemButton}>
                                    <span className={styles.plantItemAlias}>{p.alias}</span>
                                    <small className={styles.plantItemName}>{p.name}</small>
                                </summary>
                                <div>
                                    asdflkajsdlkfj
                                    <a href="./view">See details</a>
                                </div>
                            </details>
                        </li>
                    )}
                </ul>
            </section>
        </main>
    )
}
