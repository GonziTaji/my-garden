'use client'

import { deletePlantDefinition } from '../actions'
import { useTransition } from 'react'
import type { PlantDefinitionRow } from '@/db/stores/plant-definitions.store'
import { waterProfile } from '@/domain/plants/water/water-profile'
import { lightLevel } from '@/domain/plants/light/light-level'
import { soilType } from '@/domain/plants/soil/soil-type'
import { plantCategory } from '@/domain/plants/category/plant-category'

export interface PlantDefinitionsListProps {
    definitions: PlantDefinitionRow[]
}

export default function PlantDefinitionsList({ definitions }: PlantDefinitionsListProps) {
    const [isPending, startTransition] = useTransition()

    function handleDelete(id: number, name: string) {
        const confirmed = confirm(
            `Esto eliminara el tipo "${name}" y todas sus plantas asociadas. ¿Continuar?`
        )

        if (!confirmed) return

        startTransition(async () => {
            const result = await deletePlantDefinition(id)
            if (!result.success) {
                alert(result.error ?? 'Error al eliminar')
            }
        })
    }

    if (definitions.length === 0) {
        return (
            <p className="empty-list">
                No hay tipos de plantas definidos. Crea uno usando el formulario.
            </p>
        )
    }

    return (
        <ul className="plant-definitions-list">
            {definitions.map((def) => (
                <li key={def.id} className="plant-definition-item">
                    <div className="plant-definition-header">
                        <strong className="plant-definition-common-name">{def.commonName}</strong>
                        <em className="plant-definition-scientific-name">{def.scientificName}</em>
                    </div>
                    <div className="plant-definition-details">
                        <span>
                            Agua: {waterProfile.meta[def.waterProfile]?.label ?? def.waterProfile}
                        </span>
                        <span>
                            Luz: {lightLevel.meta[def.lightLevel]?.label ?? def.lightLevel}
                        </span>
                        <span>
                            Suelo: {soilType.meta[def.soilType]?.label ?? def.soilType}
                        </span>
                        {def.categories.length > 0 && (
                            <span>
                                Categorias: {def.categories.map(
                                    (c) => plantCategory.meta[c]?.label ?? c
                                ).join(', ')}
                            </span>
                        )}
                    </div>
                    <button
                        className="delete-button"
                        onClick={() => handleDelete(def.id, def.commonName)}
                        disabled={isPending}
                    >
                        {isPending ? 'Eliminando...' : 'Eliminar'}
                    </button>
                </li>
            ))}
        </ul>
    )
}
