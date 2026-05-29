import { createFileRoute } from "@tanstack/react-router"
import DefinitionView from "@/ui/components/DefinitionView"
import type { PlantDefinition } from "@/domain/plants/plant-definition"

export const Route = createFileRoute("/catalog/$plantdefid")({
  component: Page,
})

function Page() {
  const record = {} as PlantDefinition

  return <DefinitionView record={record} editMode={false} />
}
