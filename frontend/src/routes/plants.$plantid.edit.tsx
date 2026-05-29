import PlantCreationForm from '@/ui/components/PlantCreationForm';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute("/plants/$plantid/edit")({
  component: Page,
})

function Page() {
  return <PlantCreationForm />
}
