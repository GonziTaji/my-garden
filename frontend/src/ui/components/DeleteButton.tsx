import type { PlantDefinition } from "@/domain/plants/plant-definition"
import { cn } from "@sglara/cn"
import { buttonVariants } from "@/ui/classVariants/button"
import { useTransition } from "react"
import { useDeleteDefinition } from "@/api/definitions"
import { useNavigate } from "@/router/provider"

export interface DeleteButtonProps {
  plantdef: PlantDefinition
}

export default function DeleteButton({ plantdef }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition()
  const deleteDefinition = useDeleteDefinition()
  const navigate = useNavigate()

  const handleDelete = (id: number, name: string) => {
    const confirmed = confirm(
      `Esto eliminara el tipo "${name}" y todas sus plantas asociadas. ¿Continuar?`,
    )

    if (!confirmed) return

    startTransition(async () => {
      try {
        await deleteDefinition.mutateAsync(id)
        navigate("/catalog")
      } catch (err) {
        alert(err instanceof Error ? err.message : "Error al eliminar")
      }
    })
  }

  return (
    <div>
      <button
        type="button"
        className={cn(buttonVariants({ variant: "danger" }))}
        onClick={() => handleDelete(plantdef.id!, plantdef.commonName)}
        disabled={isPending}
      >
        {isPending ? "Eliminando..." : "Eliminar"}
      </button>
    </div>
  )
}
