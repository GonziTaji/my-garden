import { useSearch } from '@tanstack/react-router'
import SpeciesView from '@/ui/plant-species/components/SpeciesView'
import { useSpeciesById } from '@/ui/plant-species/queries/species'
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

export default function NewSpeciesPage() {
  const { clonedFrom } = useSearch({ from: '/catalog/new' })

  const { data: specie } = useSpeciesById(clonedFrom || 0)
  const record = clonedFrom && specie ? specie : emptySpecies

  return <SpeciesView record={record} editMode={true} />
}
