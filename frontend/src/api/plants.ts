import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { PlantImage, PlantWithDefinition } from '@/domain/plants/plant'
import type { PlantDefinition } from '@/domain/plants/plant-definition'

export async function deletePlantImage(
  plantId: number,
  imageId: number
): Promise<void> {
  const res = await fetch(`/api/plants/${plantId}/images/${imageId}`, {
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
  const res = await fetch(`/api/plants/${plantId}/images`, {
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
    filepath: data.filepath,
    createdAt: data.created_at,
  }
}

interface CreatePlantInput {
  nickname: string
  source?: string
  location?: string
  acquired_at?: string
  notes?: string
  plant_definition_id?: number
}

interface ApiPlantImage {
  id: number
  plant_id: number
  filepath: string
  created_at: string
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
  images: ApiPlantImage[]
  created_at: string
  updated_at: string
}

function toDomain(p: ApiPlantWithDefinition): PlantWithDefinition {
  return {
    id: p.id,
    nickname: p.nickname,
    source: p.source ?? undefined,
    plantDefinitionId: p.plant_definition_id,
    acquiredAt: p.acquired_at ? new Date(p.acquired_at) : undefined,
    location: p.location ?? undefined,
    notes: p.notes ?? undefined,
    images:
      p.images?.map((img) => ({
        id: img.id,
        plantId: img.plant_id,
        filepath: img.filepath,
        createdAt: img.created_at,
      })) || [],
    definition: {
      id: p.plant_definition.id,
      commonName: p.plant_definition.common_name,
      scientificName: p.plant_definition.scientific_name,
      waterProfile: '' as PlantDefinition['waterProfile'],
      lightLevel: '' as PlantDefinition['lightLevel'],
      soilType: '' as PlantDefinition['soilType'],
      petToxicity: '' as PlantDefinition['petToxicity'],
      petToxicityNotes: '',
      notes: '',
      categories: [],
      images: [],
    },
  }
}

export function usePlants(defId?: number) {
  return useQuery({
    queryKey: ['plants', defId],
    queryFn: () => {
      const params = defId ? `?plant_definition_id=${defId}` : ''
      return api.get<ApiPlantWithDefinition[]>(`/api/plants${params}`)
    },
    select: (data) => data.map(toDomain),
  })
}

export function usePlant(id: number) {
  return useQuery({
    queryKey: ['plants', id],
    queryFn: () => api.get<ApiPlantWithDefinition>(`/api/plants/${id}`),
    select: toDomain,
    enabled: !!id,
  })
}

export function useCreatePlant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePlantInput) =>
      api.post<ApiPlantWithDefinition>('/api/plants', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plants'] })
    },
  })
}
