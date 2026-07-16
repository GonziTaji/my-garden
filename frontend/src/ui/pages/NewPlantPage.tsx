import { useSearch } from '@tanstack/react-router'
import PlantForm from '@/ui/components/PlantForm'

export default function NewPlantPage() {
  let { plantSpeciesId } = useSearch({ from: '/plants/new' })

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-center text-secondary-dark mb-4">
        Nueva planta
      </h2>
      <PlantForm plantSpeciesId={plantSpeciesId} />
    </div>
  )
}
