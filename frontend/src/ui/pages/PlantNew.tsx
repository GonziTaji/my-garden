import { useSearchParams } from '@/router/provider'
import PlantForm from '@/ui/components/PlantForm'

export default function PlantNew() {
  const [searchParams] = useSearchParams()
  const spIdParam = searchParams.get('plant_species_id')
  const plantSpeciesId = spIdParam ? Number(spIdParam) : undefined

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-center text-secondary-dark mb-4">
        Nueva planta
      </h2>
      <PlantForm plantSpeciesId={plantSpeciesId} />
    </div>
  )
}
