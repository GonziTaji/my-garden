import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'

import type { PlantSpecies } from '@/domain/plants/plant-species'
import type { PlantSpeciesImage } from '@/domain/plants/plant-image'

interface CreateSpeciesInput {
  common_name: string
  scientific_name: string
  water_profile: string
  light_level?: string
  soil_type?: string
  pet_toxicity?: string
  pet_toxicity_notes?: string
  notes?: string
  categories?: string[]
  images?: { filepath: string; position: number }[]
  is_quick?: boolean
}

interface ApiSpeciesImage {
  id: number
  plant_species_id: number
  filepath: string
  position: number
}

interface ApiSpecies {
  id: number
  common_name: string
  scientific_name: string
  water_profile: string
  light_level: string
  soil_type: string
  pet_toxicity: string
  pet_toxicity_notes: string
  categories_json: string
  notes: string
  user_id: number
  visibility: string
  author_username: string
  images: ApiSpeciesImage[]
  is_favorited: boolean
  user_plant_count: number
  is_quick: boolean
  deleted_at?: string | null
  created_at: string
  updated_at: string
}

function toDomain(d: ApiSpecies): PlantSpecies {
  return {
    id: d.id,
    commonName: d.common_name,
    scientificName: d.scientific_name,
    waterProfile: d.water_profile as PlantSpecies['waterProfile'],
    lightLevel: d.light_level as PlantSpecies['lightLevel'],
    soilType: d.soil_type as PlantSpecies['soilType'],
    petToxicity: d.pet_toxicity as PlantSpecies['petToxicity'],
    petToxicityNotes: d.pet_toxicity_notes,
    notes: d.notes,
    categories: JSON.parse(
      d.categories_json || '[]'
    ) as PlantSpecies['categories'],
    images: d.images.map((img): Omit<PlantSpeciesImage, 'plantSpeciesId'> => ({
      id: img.id,
      filepath: img.filepath,
      position: img.position,
    })),
    isFavorited: d.is_favorited,
    userPlantCount: d.user_plant_count,
    isQuick: d.is_quick,
    userId: d.user_id,
    visibility: d.visibility,
    authorUsername: d.author_username,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    deletedAt: d.deleted_at ?? undefined,
  }
}

/** All species for the explore page */
export function useExploreSpecies() {
  return useQuery({
    queryKey: ['species', 'explore'],
    queryFn: () => api.get<ApiSpecies[]>('/api/plant-species/all'),
    select: (data) => data.map(toDomain),
  })
}

export function useSpecies(scope?: string) {
  return useQuery({
    queryKey: scope ? ['species', scope] : ['species'],
    queryFn: () => {
      const path = scope
        ? `/api/plant-species?scope=${scope}`
        : '/api/plant-species'
      return api.get<ApiSpecies[]>(path)
    },
    select: (data) => data.map(toDomain),
  })
}

export function useSpeciesById(id: number) {
  return useQuery({
    queryKey: ['species', id],
    queryFn: () => api.get<ApiSpecies>(`/api/plant-species/${id}`),
    select: toDomain,
    enabled: !!id,
  })
}

export function useCreateSpecies() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSpeciesInput) =>
      api.post<ApiSpecies>('/api/plant-species', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['species'] })
    },
  })
}

export function useUpdateSpecies() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: { id: number } & Partial<CreateSpeciesInput>) =>
      api.put<ApiSpecies>(`/api/plant-species/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['species'] })
    },
  })
}

export function useDeleteSpecies() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.del(`/api/plant-species/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['species'] })
    },
  })
}

export function useToggleFavorite() {
  return useMutation({
    mutationFn: (id: number) =>
      api.post<{ favorited: boolean }>(`/api/plant-species/${id}/favorite`),
  })
}
