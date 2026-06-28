import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "./client"
import type { PlantEvent, CalendarEntry } from "@/domain/plants/plant-event"

interface CreateEventInput {
  event_type: string
  event_date: string
  notes?: string | null
  metadata?: Record<string, unknown>
}

interface ApiPlantEvent {
  id: number
  plant_id: number
  event_type: string
  event_date: string
  notes: string
  metadata: Record<string, unknown>
  images: string[]
  created_at: string
  user_id: number
}

function toDomain(e: ApiPlantEvent): PlantEvent {
  return {
    id: e.id,
    plantId: e.plant_id,
    type: e.event_type as PlantEvent['type'],
    eventDate: e.event_date,
    notes: e.notes || undefined,
    metadata: e.metadata as PlantEvent['metadata'],
    images: e.images || [],
  }
}

export function usePlantEvents(plantId: number) {
  return useQuery({
    queryKey: ["events", plantId],
    queryFn: () =>
      api.get<ApiPlantEvent[]>(`/api/plants/${plantId}/events`),
    select: (data) => data.map(toDomain),
    enabled: !!plantId,
  })
}

export function usePlantEvent(plantId: number, eventId: number) {
  return useQuery({
    queryKey: ["events", plantId, eventId],
    queryFn: () =>
      api.get<ApiPlantEvent>(`/api/plants/${plantId}/events/${eventId}`),
    select: toDomain,
    enabled: !!plantId && !!eventId,
  })
}

export function useCreateEvent(plantId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateEventInput) =>
      api.post<ApiPlantEvent>(`/api/plants/${plantId}/events`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", plantId] })
    },
  })
}

export function useDeleteEvent(plantId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (eventId: number) =>
      api.del(`/api/plants/${plantId}/events/${eventId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", plantId] })
    },
  })
}

export function useCalendarEvents(plantId: number, start: string, end: string) {
  return useQuery({
    queryKey: ["events", "calendar", plantId, start, end],
    queryFn: () =>
      api.get<CalendarEntry[]>(`/api/plants/${plantId}/events/calendar/${start}/${end}`),
    enabled: !!plantId && !!start && !!end,
    staleTime: 30_000,
  })
}

export function useEventsRange(plantIds: number[], start: string, end: string, eventType?: string | null) {
  return useQuery({
    queryKey: ["events", "range", ...[...plantIds].sort(), start, end, eventType],
    queryFn: () =>
      api.post<ApiPlantEvent[]>("/api/events/range", {
        plant_ids: plantIds,
        start_date: start,
        end_date: end,
        event_type: eventType || null,
      }),
    enabled: plantIds.length > 0,
    staleTime: 30_000,
    select: (data) => data.map(toDomain),
  })
}

export function useLastEventDates(plantIds: number[], eventType?: string | null) {
  return useQuery({
    queryKey: ["events", "last-dates", ...[...plantIds].sort(), eventType],
    queryFn: () =>
      api.post<Record<string, string | null>>("/api/plants/last-event", {
        plant_ids: plantIds,
        event_type: eventType || null,
      }),
    enabled: plantIds.length > 0,
    staleTime: 30_000,
  })
}
