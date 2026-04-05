'use client'

import { deletePlant } from '../../actions'
import CreatePlantForm from '../CreatePlantForm'
import styles from './styles.module.css'
import { useTransition } from 'react'
import type { PlantWithDefinition } from '@/db/stores/plants.store'
import type { PlantDefinitionRow } from '@/db/stores/plant-definitions.store'

export interface PlantsListProps {
    plants: PlantWithDefinition[]
    plantDefinitions: PlantDefinitionRow[]
}

export default function PlantsList({ plants, plantDefinitions }: PlantsListProps) {
    const [isPending, startTransition] = useTransition()

    function handleCreatedPlant(newPlantId: number) {
        console.log('Planta creada con ID:', newPlantId)
    }

    function handleDelete(id: number, nickname: string) {
        const confirmed = confirm(`¿Eliminar la planta "${nickname}"?`)

        if (!confirmed) return

        startTransition(async () => {
            const result = await deletePlant(id)
            if (!result.success) {
                alert(result.error ?? 'Error al eliminar')
            }
        })
    }

    return (
        <main>
            <h1>Mi jardin</h1>

            <section>
                <h2>Nueva planta</h2>
                <CreatePlantForm
                    plantDefinitions={plantDefinitions}
                    onCreated={handleCreatedPlant}
                />
            </section>

            <section>
                <h2>Mis plantas</h2>
                {plants.length === 0 ? (
                    <p className="empty-list">
                        No tienes plantas registradas. Agrega una usando el formulario.
                    </p>
                ) : (
                    <ul className="plants-list">
                        {plants.map((p) => (
                            <li key={p.id}>
                                <details data-plant-id={p.id}>
                                    <summary className={styles.plantItemButton}>
                                        <span className={styles.plantItemAlias}>{p.nickname}</span>
                                        <small className={styles.plantItemName}>
                                            {p.plantDefinition.commonName} ({p.plantDefinition.scientificName})
                                        </small>
                                    </summary>
                                    <div className={styles.plantItemDetails}>
                                        {p.location && <p>Ubicacion: {p.location}</p>}
                                        {p.notes && <p>Notas: {p.notes}</p>}
                                        <div className={styles.plantItemActions}>
                                            <a href={`/plants/${p.id}`}>Ver detalles</a>
                                            <button
                                                onClick={() => handleDelete(p.id, p.nickname)}
                                                disabled={isPending}
                                                className="delete-button"
                                            >
                                                {isPending ? 'Eliminando...' : 'Eliminar'}
                                            </button>
                                        </div>
                                    </div>
                                </details>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </main>
    )
}
