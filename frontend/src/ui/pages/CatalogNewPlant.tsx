import { useParams } from '@tanstack/react-router'
import { useSpeciesById } from '@/api/species'
import PlantForm from '@/ui/components/PlantForm'

export default function CatalogNewPlant() {
  const { plantspeciesid: plantspeciesidParam } = useParams({ from: '/catalog/$plantspeciesid/new-plant' })
  const spId = Number(plantspeciesidParam)
  const { data: species, isLoading } = useSpeciesById(spId)

  if (isLoading)
    return (
      <div className="p-8 text-center text-secondary-strong">Cargando...</div>
    )

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-center text-secondary-dark mb-4">
        Nueva planta
      </h2>
      {species && (
        <p className="text-center text-secondary-strong mb-4 italic">
          {species.commonName}
          {species.scientificName && ` — ${species.scientificName}`}
        </p>
      )}
      <PlantForm plantSpeciesId={spId} />
    </div>
  )
}
