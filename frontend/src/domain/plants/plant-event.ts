import { createEnumWithMeta } from '../utils/create-enum-with-meta'

export const plantEventType = createEnumWithMeta({
  watering: { label: 'Regada' },
  fertilizing: { label: 'Fertilizada' },
  repotting: { label: 'Trasplantada' },
  note: { label: 'Nota' },
  location_change: { label: 'Cambio de ubicacion' },
})

export type PlantEventType = keyof typeof plantEventType.meta

export interface WateringMetadata {
  amount?: string
  type?: 'rocio' | 'riego'
}

export interface LocationChangeMetadata {
  location: string
}

export type EventMetadata = WateringMetadata | LocationChangeMetadata | Record<string, never>

export interface PlantEvent {
  id: number
  plantId: number
  type: PlantEventType
  eventDate: string
  notes?: string
  metadata: EventMetadata
  images: string[]
}

export interface CalendarEntry {
  id: string
  date: string
  eventType: PlantEventType
}
