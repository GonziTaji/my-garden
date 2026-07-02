import { usePlant } from '@/api/plants'
import { useNavigate, useParams } from '@/router/provider'
import PlantDetails from '@/ui/components/PlantDetails'

export default function PlantDetailPage() {
  const params = useParams()
  const navigate = useNavigate()
  const plantid = Number(params.plantid)

  const { data: plant, isLoading, error } = usePlant(plantid)

  if (isLoading) {
    return (
      <div className="p-8 text-center text-secondary-strong">Cargando...</div>
    )
  }

  if (error || !plant) {
    return (
      <div className="p-8 text-center">
        <p className="text-danger-strong">Planta no encontrada</p>
        <button
          onClick={() => navigate('/plants')}
          className="text-primary-strong underline mt-4"
        >
          Volver al la lista
        </button>
      </div>
    )
  }

  return <PlantDetails plant={plant} />
}
