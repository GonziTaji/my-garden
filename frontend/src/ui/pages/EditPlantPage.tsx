import { useParams } from '@tanstack/react-router'
import PlantForm from '@/ui/components/PlantForm'
import { usePlant } from '@/api/plants'

export default function EditPlantPage() {
  let { plantid } = useParams({ from: '/plants/$plantid/edit' })

  const { data: plant, isLoading, error } = usePlant(Number(plantid || 0))

  if (isLoading) {
    return null
  }

  if (error) {
    return error.toString()
  }

  if (!plant) {
    return <>Planta no encontrada</>
  }

  return (
    <div className="px-4 pt-5">
      <h2 className="text-2xl font-bold text-center text-neutral-dark mb-4">
        Editando {plant.nickname}
      </h2>
      <PlantForm plant={plant} />
    </div>
  )
}
