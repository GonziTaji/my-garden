'use client'

import { PlantDefinition } from "@/domain/plants/plant-definition"
import { cn } from "@sglara/cn"
import { buttonVariants } from "@/ui/classVariants/button"
import { deletePlantDefinition } from "@/ui/actions/actions"
import { useTransition } from "react"

export interface DeleteButtonProps {
    plantdef: PlantDefinition
}

export default function DeleteButton({ plantdef }: DeleteButtonProps) {
    const [isPending, startTransition] = useTransition()

    const handleDelete = (id: number, name: string) => {
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
        <div>
            <button
                type="button"
                className={cn(buttonVariants({ variant: 'danger' }))}
                onClick={() => handleDelete(plantdef.id!, plantdef.commonName)}
                disabled={isPending}
            >
                {isPending ? 'Eliminando...' : 'Eliminar'}
            </button>
        </div>
    )
}
