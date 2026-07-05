import { useParams, useSearchParams, useNavigate } from '@/router/provider'
import { useSpeciesById } from '@/api/species'
import SpeciesView from '@/ui/components/SpeciesView'

export default function CatalogDetail() {
  const { plantspeciesid } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const spId = Number(plantspeciesid)
  const { data: species, isLoading, error } = useSpeciesById(spId)

  if (isLoading) {
    return (
      <div className="p-8 text-center text-secondary-strong">Cargando...</div>
    )
  }

  if (error || !species) {
    return (
      <div className="p-8 text-center">
        <p className="text-danger-strong">Tipo de planta no encontrado</p>
        <button
          type="button"
          onClick={() => navigate('/catalog')}
          className="text-primary-strong underline mt-4"
        >
          Volver al catálogo
        </button>
      </div>
    )
  }

  const editMode = searchParams.get('e') === 'T' && !species.deletedAt

  return <SpeciesView record={species} editMode={editMode} />
}
