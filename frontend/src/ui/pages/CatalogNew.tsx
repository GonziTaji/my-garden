import DefinitionView from '@/ui/components/DefinitionView'

const emptyDefinition = {
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
  return <DefinitionView record={emptyDefinition} editMode={true} />
}
