import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "./client"

interface ToggleResult {
  watered: boolean
}

export function useToggleWatering() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ plant_id, date }: { plant_id: number; date: string }) =>
      api.post<ToggleResult>("/api/journal/watering/toggle", { plant_id, date }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["watering"] })
    },
  })
}

export function useBulkWater() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (plant_ids: number[]) =>
      api.post("/api/journal/watering/bulk", { plant_ids }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["watering"] })
    },
  })
}

export function useLastWateredDates(plantIds: number[]) {
  return useQuery({
    queryKey: ["watering", "last-watered", plantIds.sort().join(",")],
    queryFn: () =>
      api.post<Record<string, string | null>>("/api/journal/last-watered", { plant_ids: plantIds }),
    enabled: plantIds.length > 0,
    staleTime: 30_000,
  })
}

interface WateringEntry {
  plant_id: number
  watering_date: string
}

export function useWateringHistoryRange(plantIds: number[], startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["watering", "range", ...[...plantIds].sort(), startDate, endDate],
    queryFn: () =>
      api.post<WateringEntry[]>("/api/journal/watering/range", {
        plant_ids: plantIds,
        start_date: startDate,
        end_date: endDate,
      }),
    enabled: plantIds.length > 0,
    staleTime: 30_000,
    select: (entries) => {
      const map = new Map<number, Set<string>>()

      for (const e of entries) {
        const date = e.watering_date

        if (!map.has(e.plant_id)) {
          map.set(e.plant_id, new Set())
        }

        map.get(e.plant_id)!.add(date)
      }
      return map
    },
  })
}
