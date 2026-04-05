export type PlantJournalEntryType =
  | "watering"
  | "fertilizing"
  | "repotting"
  | "note"

export interface PlantJournalEntry {
  id: number

  plantId: number

  type: PlantJournalEntryType

  date: Date

  notes?: string
}
