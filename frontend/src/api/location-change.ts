import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "./client"

export interface CreateLocationChangeMutationInput {
  plantId: number
  location: string
  registeredAt: string
  notes: string
}

interface CreateLocationChangeDto {
  plant_id: number
  location: string
  registered_at: string
  notes: string
}

export function useCreateLocationChange() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ plantId, location, registeredAt, notes }: CreateLocationChangeMutationInput) =>
      api.post<void>(`/api/plants/${plantId}/location`, {
        plant_id: plantId,
        location,
        registered_at: registeredAt,
        notes,
      } satisfies CreateLocationChangeDto),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["plants", vars.plantId] })
      qc.invalidateQueries({ queryKey: ["plants"] })
    },
  })
}
