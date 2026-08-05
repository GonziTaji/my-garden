import { useParams } from '@tanstack/react-router'
import { useSpeciesById } from '@/ui/plant-species/queries/species'
import PlantForm from '@/ui/plants/components/PlantForm'

export default function CatalogNewPlant() {
  const { plantspeciesid: plantspeciesidParam } = useParams({
    from: '/catalog/$plantspeciesid/new-plant',
  })
  const spId = Number(plantspeciesidParam)
  const { data: species, isLoading } = useSpeciesById(spId)

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <p className="text-neutral-strong">Cargando...</p>
      </div>
    )

  return (
    <div className="px-4 pt-5">
      <h2 className="text-2xl font-bold text-center text-neutral-dark mb-4">Nueva planta</h2>
      {species && (
        <p className="text-center text-neutral-strong mb-4 italic text-sm">
          {species.commonName}
          {species.scientificName && ` — ${species.scientificName}`}
        </p>
      )}
      <PlantForm plantSpeciesId={spId} />
    </div>
  )
}
