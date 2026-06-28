import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "./client"
import type { Plant } from "@/domain/plants/plant"
import type { PlantEventType } from "@/domain/plants/plant-event"

interface ToggleResult {
  watered: boolean
}

export function useToggleWatering() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ plantId, date }: { plantId: number; date: string }) =>
      api.post<ToggleResult>(`/api/plants/${plantId}/events`, {
        event_type: "watering",
        event_date: date,
      }),
    onSuccess: (_data, { plantId }) => {
      qc.invalidateQueries({ queryKey: ["events", plantId] })
    },
  })
}

interface MutateQuickWaterArgs {
  plantId: number;
  date: string;
  remove?: boolean;
}

export function useQuickWater() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ plantId, date, remove }: MutateQuickWaterArgs) => {
      if (remove) {
        return api.del(`/api/plants/${plantId}/events/${date}`)
      }
      return api.post(`/api/plants/${plantId}/events`, {
        event_type: "watering",
        event_date: date,
      })
    },
    onSuccess: (_data, { plantId }) => {
      qc.invalidateQueries({ queryKey: ["events", plantId] })
    },
  })
}

export function useLastWateredDates(plantIds: number[]) {
  return useQuery({
    queryKey: ["watering", "last-watered", plantIds.sort().join(",")],
    queryFn: () =>
      api.post<Record<string, string | null>>("/api/plants/last-event", {
        plant_ids: plantIds,
        event_type: "watering",
      }),
    enabled: plantIds.length > 0,
    staleTime: 30_000,
  })
}

export interface PlantCalendarEntry {
  id: string,
  date: string,
  eventType: PlantEventType
}

export function usePlantCalendar(plantId: Plant['id'], startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["plant", "watering", plantId],
    queryFn: () =>
      api.get<PlantCalendarEntry[]>(`/api/plants/${plantId}/events/calendar/${startDate}/${endDate}`),
    enabled: Boolean(plantId && startDate && endDate),
    staleTime: 30_000,
  })
}
