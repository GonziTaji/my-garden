import { useSearch } from '@tanstack/react-router'
import PlantForm from '@/ui/plants/components/PlantForm'

export default function NewPlantPage() {
  let { plantSpeciesId } = useSearch({ from: '/plants/new' })

  return (
    <div className="px-4 pt-5">
      <h2 className="text-2xl font-bold text-center text-neutral-dark mb-4">Nueva planta</h2>
      <PlantForm plantSpeciesId={plantSpeciesId} />
    </div>
  )
}
