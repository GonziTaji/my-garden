import { useQuery } from "@tanstack/react-query"
import { api } from "./client"

export function useJournalEntry(entryId: string | null) {
  return useQuery({
    queryKey: ["plants", "journal"],
    queryFn: () => api.get(`/journal/entries/${entryId}`),
    enabled: !!entryId,
  })
}

