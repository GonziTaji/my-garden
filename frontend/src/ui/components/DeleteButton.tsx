import type { PlantSpecies } from '@/domain/plants/plant-species'
import { cn } from '@sglara/cn'
import { buttonVariants } from '@/ui/classVariants/button'
import { useTransition } from 'react'
import { useDeleteSpecies } from '@/api/species'
import { useNavigate } from '@/router/provider'

export interface DeleteButtonProps {
  plantspecies: PlantSpecies
}

export default function DeleteButton({ plantspecies }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition()
  const deleteSpecies = useDeleteSpecies()
  const navigate = useNavigate()

  const handleDelete = (id: number, name: string) => {
    const confirmed = confirm(
      `Esto eliminara el tipo "${name}" y todas sus plantas asociadas. ¿Continuar?`
    )

    if (!confirmed) return

    startTransition(async () => {
      try {
        await deleteSpecies.mutateAsync(id)
        navigate('/catalog')
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Error al eliminar')
      }
    })
  }

  return (
    <div>
      <button
        type="button"
        className={cn(buttonVariants({ variant: 'danger' }))}
        onClick={() => handleDelete(plantspecies.id!, plantspecies.commonName)}
        disabled={isPending}
      >
        {isPending ? 'Eliminando...' : 'Eliminar'}
      </button>
    </div>
  )
}
