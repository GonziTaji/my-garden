import { createEnumWithMeta } from "../utils/create-enum-with-meta"

export const plantJournalEntryType = createEnumWithMeta({
  watering: {
    label: "Regada",
  },
  fertilizing: {
    label: "Fertilizada"
  },
  repotting: {
    label: "Trasplantada",
  },
  note: {
    label: "Nota",
  },
})

export type PlantJournalEntryType = keyof typeof plantJournalEntryType.meta

export interface PlantJournalEntry {
  id: number
  plantId: number
  type: PlantJournalEntryType
  date: Date
  notes?: string
  images: string[]
}
