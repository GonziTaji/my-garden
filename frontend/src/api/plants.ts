import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "./client"
import type { PlantWithDefinition } from "@/domain/plants/plant"
import type { PlantDefinition } from "@/domain/plants/plant-definition"

interface CreatePlantInput {
  nickname: string
  source?: string
  location?: string
  acquired_at?: string
  notes?: string
  plant_definition_id?: number
}

interface UpdatePlantInput {
  nickname?: string
  source?: string
  location?: string
  acquired_at?: string
  notes?: string
}

interface ApiPlantDefinitionBrief {
  id: number
  common_name: string
  scientific_name: string
}

interface ApiPlantWithDefinition {
  id: number
  nickname: string
  source: string | null
  plant_definition_id: number
  acquired_at: string | null
  location: string | null
  notes: string | null
  plant_definition: ApiPlantDefinitionBrief
  created_at: string
  updated_at: string
}


interface ApiLocationChange {
  id: number
  plant_id: number
  location: string
  registered_at: string
  notes: string
  created_at: string
}

export interface CreateLocationChangeInput extends Omit<ApiLocationChange, "id" | "created_at"> { }

function toDomain(p: ApiPlantWithDefinition): PlantWithDefinition {
  return {
    id: p.id,
    nickname: p.nickname,
    source: p.source ?? undefined,
    plantDefinitionId: p.plant_definition_id,
    acquiredAt: p.acquired_at ? new Date(p.acquired_at) : undefined,
    location: p.location ?? undefined,
    notes: p.notes ?? undefined,
    definition: {
      id: p.plant_definition.id,
      commonName: p.plant_definition.common_name,
      scientificName: p.plant_definition.scientific_name,
      waterProfile: "" as PlantDefinition["waterProfile"],
      lightLevel: "" as PlantDefinition["lightLevel"],
      soilType: "" as PlantDefinition["soilType"],
      petToxicity: "" as PlantDefinition["petToxicity"],
      petToxicityNotes: "",
      categories: [],
      images: [],
    },
  }
}

export function usePlants(defId?: number) {
  return useQuery({
    queryKey: ["plants", defId],
    queryFn: () => {
      const params = defId ? `?plant_definition_id=${defId}` : ""
      return api.get<ApiPlantWithDefinition[]>(`/api/plants${params}`)
    },
    select: (data) => data.map(toDomain),
  })
}

export function usePlant(id: number) {
  return useQuery({
    queryKey: ["plants", id],
    queryFn: () => api.get<ApiPlantWithDefinition>(`/api/plants/${id}`),
    select: toDomain,
    enabled: !!id,
  })
}

export function useCreatePlant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePlantInput) =>
      api.post<ApiPlantWithDefinition>("/api/plants", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plants"] })
    },
  })
}

export function useUpdatePlant(plantid: ApiPlantDefinitionBrief["id"]) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdatePlantInput) =>
      api.put<ApiPlantWithDefinition>(`/api/plants/${plantid}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plants"] })
    },
  })
}

export function useCreateLocationChange() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateLocationChangeInput) =>
      api.post<ApiLocationChange>(`/api/plants/${input.plant_id}/location`, input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["plants", vars.plant_id] })
      qc.invalidateQueries({ queryKey: ["plants"] })
    },
  })
}

export function useDeletePlant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.del(`/api/plants/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plants"] })
    },
  })
}
