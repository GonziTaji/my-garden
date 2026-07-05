import { useSearchParams } from '@/router/provider'
import SpeciesView from '@/ui/components/SpeciesView'
import type { PlantSpecies } from '@/domain/plants/plant-species'

const emptySpecies = {
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

function speciesFromParams(): PlantSpecies | null {
  const sp = new URLSearchParams(window.location.search)
  const commonName = sp.get('commonName')
  if (!commonName) return null
  return {
    id: null,
    commonName,
    scientificName: sp.get('scientificName') || '',
    waterProfile: (sp.get('waterProfile') as PlantSpecies['waterProfile']) || 'dry_cycle',
    lightLevel: (sp.get('lightLevel') as PlantSpecies['lightLevel']) || 'low',
    soilType: (sp.get('soilType') as PlantSpecies['soilType']) || 'well_draining',
    petToxicity: (sp.get('petToxicity') as PlantSpecies['petToxicity']) || 'non_toxic',
    petToxicityNotes: sp.get('petToxicityNotes') || '',
    notes: '',
    categories: sp.get('categories')?.split(',').filter(Boolean) || [],
    images: [],
  }
}

export default function CatalogNew() {
  const [searchParams] = useSearchParams()
  const record = searchParams.has('commonName') ? speciesFromParams()! : emptySpecies

  return <SpeciesView record={record} editMode={true} />
}
