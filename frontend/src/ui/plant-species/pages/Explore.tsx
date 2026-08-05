import { useExploreSpecies } from '@/ui/plant-species/queries/species'
import ExploreGrid from '@/ui/plant-species/components/ExploreGrid'
import { QueryState } from '@/ui/shared/components/QueryState'

export default function Home() {
  const { data, isLoading, error } = useExploreSpecies()

  const species = data ?? []

  return (
    <QueryState isLoading={isLoading} error={error}>
      <div>
        {species.length === 0 ? (
          <div className="flex justify-center items-center min-h-[50vh] px-4">
            <p className="text-neutral-strong text-center">No hay tipos de planta públicos todavía.</p>
          </div>
        ) : (
          <ExploreGrid list={species} />
        )}
      </div>
    </QueryState>
  )
}
