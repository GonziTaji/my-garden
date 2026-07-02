import { useParams, useNavigate } from '@/router/provider'
import { useDefinition } from '@/api/definitions'
import PlantForm from '@/ui/components/PlantForm'

export default function CatalogNewPlant() {
  const { plantdefid } = useParams()
  const defId = Number(plantdefid)
  const { data: definition, isLoading } = useDefinition(defId)

  if (isLoading)
    return (
      <div className="p-8 text-center text-secondary-strong">Cargando...</div>
    )

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-center text-secondary-dark mb-4">
        Nueva planta
      </h2>
      {definition && (
        <p className="text-center text-secondary-strong mb-4 italic">
          {definition.commonName}
          {definition.scientificName && ` — ${definition.scientificName}`}
        </p>
      )}
      <PlantForm plantDefinitionId={defId} />
    </div>
  )
}
