import { useSearch } from '@tanstack/react-router'
import SpeciesView from '@/ui/components/SpeciesView'
import { useSpeciesById } from '@/api/species'
import type { PlantSpecies } from '@/domain/plants/plant-species'

const emptySpecies: PlantSpecies = {
  id: null,
  commonName: '',
  scientificName: '',
  waterProfile: 'dry_cycle' as const,
  lightLevel: 'low' as const,
  soilType: 'well_draining' as const,
  petToxicity: 'non_toxic' as const,
  petToxicityNotes: '',
  notes: '',
  categories: [],
  images: [],
}

export default function CatalogNew() {
  const { clonedFrom } = useSearch({ from: '/catalog/new' })

  const { data: specie } = useSpeciesById(clonedFrom)
  const record = clonedFrom && specie ? specie : emptySpecies

  return <SpeciesView record={record} editMode={true} />
}
