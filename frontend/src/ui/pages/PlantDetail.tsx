import { usePlant } from '@/api/plants'
import { useNavigate, useParams } from '@tanstack/react-router'
import PlantDetails from '@/ui/components/PlantDetails'
import { QueryState } from '@/ui/components/QueryState'

export default function PlantDetailPage() {
  const { plantid: plantidParam } = useParams({ from: '/plants/$plantid' })
  const navigate = useNavigate()
  const plantid = Number(plantidParam)

  const { data: plant, isLoading, error } = usePlant(plantid)

  if (error || !plant) {
    return (
      <div className="p-8 text-center">
        <p className="text-danger-strong">Planta no encontrada</p>
        <button
          type="button"
          onClick={() => navigate({ to: '/plants' })}
          className="text-primary-dark hover:text-primary-strong underline mt-4 transition-colors"
        >
          Volver a la lista
        </button>
      </div>
    )
  }

  return (
    <QueryState isLoading={isLoading}>
      <PlantDetails plant={plant} />
    </QueryState>
  )
}
