import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'

const base = import.meta.env.BASE_URL

import type { PlantImage, PlantWithSpecies } from '@/domain/plants/plant'
import type { PlantSpecies } from '@/domain/plants/plant-species'

export async function deletePlantImage(
  plantId: number,
  imageId: number
): Promise<void> {
  const res = await fetch(`${base}api/plants/${plantId}/images/${imageId}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Error al eliminar imagen')
  }
}

export async function addPlantImage(
  plantId: number,
  file: File
): Promise<PlantImage> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(`${base}api/plants/${plantId}/images`, {
    method: 'POST',
    body: fd,
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Error al subir imagen')
  }
  const data: ApiPlantImage = await res.json()
  return {
    id: data.id,
    plantId: data.plant_id,
    filepath: base + data.filepath,
    createdAt: data.created_at,
  }
}

export interface UpsertPlantInput {
  nickname: string
  source?: string
  location?: string
  acquired_at?: string
  notes?: string
  plant_species_id?: number
  images: string[]
}

interface ApiPlantSpeciesBrief {
  id: number
  common_name: string
  scientific_name: string
  deleted_at?: string | null
}

interface ApiPlantImage {
  id: number
  plant_id: number
  filepath: string
  created_at: string
}

interface ApiPlantWithSpecies {
  id: number
  nickname: string
  source: string | null
  acquired_at: string | null
  location: string | null
  notes: string | null
  plant_species: ApiPlantSpeciesBrief
  images: ApiPlantImage[]
  created_at: string
  updated_at: string
}

function toDomain(p: ApiPlantWithSpecies): PlantWithSpecies {
  return {
    id: p.id,
    nickname: p.nickname,
    source: p.source ?? undefined,
    plantSpeciesId: p.plant_species.id,
    acquiredAt: p.acquired_at ? new Date(p.acquired_at) : undefined,
    location: p.location ?? undefined,
    notes: p.notes ?? undefined,
    images: (p.images || []).map((img): PlantImage => ({
      id: img.id,
      plantId: img.plant_id,
      filepath: img.filepath,
      createdAt: img.created_at,
    })),
    species: {
      id: p.plant_species.id,
      commonName: p.plant_species.common_name,
      scientificName: p.plant_species.scientific_name,
      waterProfile: '' as PlantSpecies['waterProfile'],
      lightLevel: '' as PlantSpecies['lightLevel'],
      soilType: '' as PlantSpecies['soilType'],
      petToxicity: '' as PlantSpecies['petToxicity'],
      petToxicityNotes: '',
      notes: '',
      categories: [],
      images: [],
      deletedAt: p.plant_species.deleted_at ?? undefined,
    },
  }
}

export function usePlants(speciesId?: number) {
  return useQuery({
    queryKey: ['plants', speciesId],
    queryFn: () => {
      const params = speciesId ? `?plant_species_id=${speciesId}` : ''
      return api.get<ApiPlantWithSpecies[]>(`/api/plants${params}`)
    },
    select: (data) => data.map(toDomain),
  })
}

export function usePlant(id: number) {
  return useQuery({
    queryKey: ['plants', id],
    queryFn: () => api.get<ApiPlantWithSpecies>(`/api/plants/${id}`),
    select: toDomain,
    enabled: !!id,
  })
}

export function useUpsertPlant(id?: number) {
  const qc = useQueryClient()
  const url = id ? `/api/plants/${id}` : '/api/plants'

  return useMutation({
    mutationFn: (input: UpsertPlantInput) => {
      return api.post<ApiPlantWithSpecies>(url, input)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plants'] })
    },
  })
}

export function useUpdatePlant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpsertPlantInput) => api.post<ApiPlantWithSpecies>('/api/plants', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plants'] })
    },
  })
}

export function useDeletePlant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.del(`/api/plants/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plants'] })
    },
  })
}
