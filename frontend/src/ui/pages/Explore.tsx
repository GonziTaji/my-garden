import { useExploreSpecies } from '@/api/species'
import ExploreGrid from '@/ui/components/ExploreGrid'

export default function Home() {
  const { data, isLoading, error } = useExploreSpecies()

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="text-neutral-strong">Cargando...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="text-danger-strong">Error al cargar</p>
      </div>
    )
  }

  const species = data ?? []

  if (species.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="text-neutral-strong">
          No hay tipos de planta públicos todavía.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-2">
      <ExploreGrid list={species} />
    </div>
  )
}
