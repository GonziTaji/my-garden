import type { PlantSpecies } from '@/domain/plants/plant-species'
import type { User } from '@/auth/AuthContext'
import { Link, useNavigate } from '@tanstack/react-router'
import { buttonVariants } from '@/ui/class-variants/button'
import { useToggleFavorite } from '@/ui/plant-species/queries/species'

interface SpeciesHeaderProps {
  editMode: boolean
  isPending: boolean
  isDeleted: boolean
  record: PlantSpecies
  user: User | null
  favorited: boolean
  onToggleFavorite: (favorited: boolean) => void
}

export function SpeciesHeader({
  editMode,
  isPending,
  isDeleted,
  record,
  user,
  favorited,
  onToggleFavorite,
}: SpeciesHeaderProps) {
  const toggleFavorite = useToggleFavorite()
  const navigate = useNavigate()

  function handleCloneSpecies() {
    if (record.id) {
      navigate({ to: '/catalog/new', search: { clonedFrom: record.id } })
    }
  }

  const handleToggleFavorite = async () => {
    const result = await toggleFavorite.mutateAsync(record.id!)
    onToggleFavorite(result.favorited)
  }

  return (
    <div className="flex gap-3 justify-end mb-6">
      {editMode && !isDeleted ? (
        <>
          <button
            className={buttonVariants({ variant: 'primary' })}
            type="submit"
            disabled={isPending}
          >
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>

          <button
            type="button"
            onClick={() => history.back()}
            className={buttonVariants({ variant: 'secondary' })}
          >
            Cancelar
          </button>
        </>
      ) : user && !isDeleted ? (
        <>
          {user.id !== record.userId && (
            <>
              <button
                type="button"
                onClick={handleCloneSpecies}
                className={buttonVariants({ variant: 'secondary' })}
              >
                Clonar
              </button>
              <button
                type="button"
                onClick={handleToggleFavorite}
                className={buttonVariants({ variant: 'clean' })}
              >
                {favorited ? '♥' : '♡'}
              </button>
            </>
          )}
          {user.id === record.userId && (
            <Link
              to="/catalog/$plantspeciesid"
              params={{ plantspeciesid: String(record.id!) }}
              search={{ e: 'T' }}
              className={buttonVariants({ variant: 'primary' })}
            >
              Editar
            </Link>
          )}
        </>
      ) : null}
    </div>
  )
}
