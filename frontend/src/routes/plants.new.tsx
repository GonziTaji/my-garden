import { createFileRoute } from '@tanstack/react-router'
import NewPlantNameForm from '@/ui/components/PlantForm.tsx'

export const Route = createFileRoute("/plants/new")({
  component: RouteComponent,
})

function RouteComponent() {
  return <NewPlantNameForm />
}
