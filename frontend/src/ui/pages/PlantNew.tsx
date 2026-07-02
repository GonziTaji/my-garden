import { useSearchParams } from '@/router/provider'
import PlantForm from '@/ui/components/PlantForm'

export default function PlantNew() {
  const [searchParams] = useSearchParams()
  const defIdParam = searchParams.get('plant_definition_id')
  const plantDefinitionId = defIdParam ? Number(defIdParam) : undefined

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-center text-secondary-dark mb-4">
        Nueva planta
      </h2>
      <PlantForm plantDefinitionId={plantDefinitionId} />
    </div>
  )
}
