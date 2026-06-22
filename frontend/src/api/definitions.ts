import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "./client"
import { useNavigate } from "@/router/provider"
import type { PlantDefinition } from "@/domain/plants/plant-definition"
import type { PlantDefinitionImage } from "@/domain/plants/plant-image"

interface CreateDefinitionInput {
  common_name: string
  scientific_name: string
  water_profile: string
  light_level: string
  soil_type: string
  pet_toxicity: string
  pet_toxicity_notes?: string
  categories?: string[]
  images?: { filepath: string; position: number }[]
}

interface ApiDefinitionImage {
  id: number
  plant_definition_id: number
  filepath: string
  position: number
}

interface ApiDefinition {
  id: number
  common_name: string
  scientific_name: string
  water_profile: string
  light_level: string
  soil_type: string
  pet_toxicity: string
  pet_toxicity_notes: string
  categories_json: string
  user_id: number
  visibility: string
  images: ApiDefinitionImage[]
  created_at: string
  updated_at: string
}

function toDomain(d: ApiDefinition): PlantDefinition {
  return {
    id: d.id,
    commonName: d.common_name,
    scientificName: d.scientific_name,
    waterProfile: d.water_profile as PlantDefinition["waterProfile"],
    lightLevel: d.light_level as PlantDefinition["lightLevel"],
    soilType: d.soil_type as PlantDefinition["soilType"],
    petToxicity: d.pet_toxicity as PlantDefinition["petToxicity"],
    petToxicityNotes: d.pet_toxicity_notes,
    categories: JSON.parse(d.categories_json || "[]") as PlantDefinition["categories"],
    images: d.images.map((img): Omit<PlantDefinitionImage, "plantDefinitionId"> => ({
      id: img.id,
      filepath: img.filepath,
      position: img.position,
    })),
    userId: d.user_id,
    visibility: d.visibility,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  }
}

export function useDefinitions() {
  return useQuery({
    queryKey: ["definitions"],
    queryFn: () => api.get<ApiDefinition[]>("/api/plant-definitions"),
    select: (data) => data.map(toDomain),
  })
}

export function useDefinition(id: number) {
  return useQuery({
    queryKey: ["definitions", id],
    queryFn: () => api.get<ApiDefinition>(`/api/plant-definitions/${id}`),
    select: toDomain,
    enabled: !!id,
  })
}

export function useCreateDefinition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateDefinitionInput) =>
      api.post<ApiDefinition>("/api/plant-definitions", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["definitions"] })
    },
  })
}

export function useUpdateDefinition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: number } & Partial<CreateDefinitionInput>) =>
      api.put<ApiDefinition>(`/api/plant-definitions/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["definitions"] })
    },
  })
}

export function useDeleteDefinition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.del(`/api/plant-definitions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["definitions"] })
    },
  })
}

export function useCloneDefinition() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (id: number) =>
      api.post<ApiDefinition>(`/api/plant-definitions/${id}/clone`),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["definitions"] })
      navigate("/catalog/:plantdefid", { params: { plantdefid: String(data.id) } })
    },
  })
}

export function useToggleFavorite() {
  return useMutation({
    mutationFn: (id: number) =>
      api.post<{ favorited: boolean }>(`/api/plant-definitions/${id}/favorite`),
  })
}

export async function uploadDefinitionImage(file: File): Promise<string> {
  const fd = new FormData()
  fd.append("file", file)
  const res = await api.upload("/api/upload/plant-definition-image", fd)
  const data = await res.json()
  return data.filepath as string
}
