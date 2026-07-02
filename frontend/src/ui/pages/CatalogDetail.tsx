import { useParams, useSearchParams, useNavigate } from '@/router/provider'
import { useDefinition } from '@/api/definitions'
import DefinitionView from '@/ui/components/DefinitionView'

export default function CatalogDetail() {
  const { plantdefid } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const defId = Number(plantdefid)
  console.log({ plantdefid, defId })

  const { data: definition, isLoading, error } = useDefinition(defId)

  if (isLoading) {
    console.log('isloading')
    return (
      <div className="p-8 text-center text-secondary-strong">Cargando...</div>
    )
  }

  if (error || !definition) {
    console.log({ error, definition })
    return (
      <div className="p-8 text-center">
        <p className="text-danger-strong">Tipo de planta no encontrado</p>
        <button
          onClick={() => navigate('/catalog')}
          className="text-primary-strong underline mt-4"
        >
          Volver al catálogo
        </button>
      </div>
    )
  }

  const editMode = searchParams.get('e') === 'T'

  return <DefinitionView record={definition} editMode={editMode} />
}
