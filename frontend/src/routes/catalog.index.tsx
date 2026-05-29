import { createFileRoute } from "@tanstack/react-router"
import DefinitionsCatalog from "../ui/components/DefinitionsCatalog"
import type { PlantDefinition } from "../domain/plants/plant-definition"

export const Route = createFileRoute("/catalog/")({
  component: PlantDefinitionsPage,
})

function PlantDefinitionsPage() {
  const definitionsList = [] satisfies PlantDefinition[]

  return (
    <DefinitionsCatalog list={definitionsList} />
  )
}
