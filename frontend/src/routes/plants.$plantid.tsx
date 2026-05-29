import { createFileRoute } from "@tanstack/react-router"
import PlantDetails from "@/ui/components/PlantDetails.tsx"
import type { PlantWithDefinition } from "@/domain/plants/plant"

export const Route = createFileRoute("/plants/$plantid")({
  component: Page,
})

function Page() {
  return <PlantDetails plant={{} as PlantWithDefinition} />
}
