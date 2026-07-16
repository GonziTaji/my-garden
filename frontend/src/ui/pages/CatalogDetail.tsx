import { useParams, useSearch, useNavigate } from '@tanstack/react-router'
import { useSpeciesById } from '@/api/species'
import SpeciesView from '@/ui/components/SpeciesView'

export default function CatalogDetail() {
  const { plantspeciesid: plantspeciesidParam } = useParams({ from: '/catalog/$plantspeciesid' })
  const { e } = useSearch({ from: '/catalog/$plantspeciesid' })
  const navigate = useNavigate()
  const spId = Number(plantspeciesidParam)
  const { data: species, isLoading, error } = useSpeciesById(spId)

  if (isLoading) {
    return <div className="p-8 text-center text-neutral-strong">Cargando...</div>
  }

  if (error || !species) {
    return (
      <div className="p-8 text-center">
        <p className="text-danger-strong">Tipo de planta no encontrado</p>
        <button
          type="button"
          onClick={() => navigate({ to: '/catalog' })}
          className="text-primary-dark hover:text-primary-strong underline mt-4 transition-colors"
        >
          Volver al catálogo
        </button>
      </div>
    )
  }

  const editMode = e === 'T' && !species.deletedAt

  return <SpeciesView record={species} editMode={editMode} />
}
