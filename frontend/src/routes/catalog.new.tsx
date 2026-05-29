import { createFileRoute } from "@tanstack/react-router"
import type { PlantDefinition } from "@/domain/plants/plant-definition"
import DefinitionView from "@/ui/components/DefinitionView"

export const Route = createFileRoute("/catalog/new")({
  component: Page,
})

function Page() {
  const newDefinition: PlantDefinition = {
    id: null,
    commonName: "",
    scientificName: "",
    waterProfile: "dry_cycle",
    lightLevel: "low",
    soilType: "well_draining",
    petToxicity: "non_toxic",
    petToxicityNotes: "",
    categories: [],
    images: [],
  }

  return <DefinitionView record={newDefinition} editMode={true} />
}
