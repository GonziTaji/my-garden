'use client'

import { PlantDefinition } from "@/domain/plants/plant-definition"
import { deletePlantDefinition } from "@/app/plant-definitions/actions"
import { useTransition } from "react"
import styles from './styles.module.css'
import { cn } from "@sglara/cn"

interface DeletePlantDefinitionButtonProps {
    className?: string,
    def: PlantDefinition
    disabled?: boolean
}

export default function DeletePlantDefinitionButton({ className, def }: DeletePlantDefinitionButtonProps) {
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
            type="button"
            className={cn(styles.deleteButton, className)}
            onClick={() => handleDelete(def.id!, def.commonName)}
            disabled={isPending}
        >
            {isPending ? 'Eliminando...' : 'Eliminar'}
        </button>
    )
}
