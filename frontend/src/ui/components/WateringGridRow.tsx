import type { PlantWithDefinition } from '@/domain/plants/plant'
import WateringGridCell from './WateringGridCell'

interface WateringGridRowProps {
  plant: PlantWithDefinition
  dates: string[]
  wateredDates: Set<string>
}

export default function WateringGridRow({ plant, dates, wateredDates }: WateringGridRowProps) {
  console.log({ plant, dates, wateredDates })

  return (
  )
}
