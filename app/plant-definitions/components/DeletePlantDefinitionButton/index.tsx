'use client'

import { PlantDefinition } from "@/domain/plants/plant-definition"
import { deletePlantDefinition } from "../../actions"
import { useTransition } from "react"

export default function DeletePlantDefinitionButton({ def }: { def: PlantDefinition }) {
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

    return (
        <button
            className="delete-button"
            onClick={() => handleDelete(def.id, def.commonName)}
            disabled={isPending}
        >
            {isPending ? 'Eliminando...' : 'Eliminar'}
        </button>
    )
}
