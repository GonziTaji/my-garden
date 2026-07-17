import { useNavigate } from '@tanstack/react-router'
import type { PlantSpecies } from '@/domain/plants/plant-species'
import { useCreateSpecies, useUpdateSpecies } from '@/api/species'
import { useImageUploads } from '@/api/uploads'
import { useTransition } from 'react'

interface UseSpeciesSubmitParams {
  record: PlantSpecies
  fromPlantForm?: boolean
}

export function useSpeciesSubmit({ record, fromPlantForm }: UseSpeciesSubmitParams) {
  const navigate = useNavigate()
  const createSpecies = useCreateSpecies()
  const updateSpecies = useUpdateSpecies()
  const { uploadImage } = useImageUploads()
  const [isPending, startTransition] = useTransition()

  const submitAction = async (fd: FormData) => {
    startTransition(async () => {
      try {
        const images: { filepath: string; position: number }[] = []

        for (let pos = 0; pos < 3; pos++) {
          const fileInput = fd.get(`imagesFile_${pos}`)
          if (fileInput instanceof File && fileInput.size > 0) {
            try {
              const filepath = await uploadImage(fileInput)
              images.push({ filepath, position: pos })
            } catch {
              throw new Error('Error al subir imagen')
            }
          } else {
            const existingPath = fd.get(`imagesExistingId_${pos}`)
            if (existingPath) {
              images.push({ filepath: String(existingPath), position: pos })
            }
          }
        }

        const categories = fd.getAll('categories') as string[]

        const getStrValue = (key: string) => fd.get(key)?.toString() ?? ''

        const payload = {
          common_name: getStrValue('commonName'),
          scientific_name: getStrValue('scientificName'),
          water_profile: getStrValue('waterProfile'),
          light_level: getStrValue('lightLevel'),
          soil_type: getStrValue('soilType'),
          pet_toxicity: getStrValue('petToxicity'),
          pet_toxicity_notes: getStrValue('petToxicityNotes'),
          notes: getStrValue('notes'),
          categories,
          images,
        }

        let result: { id: number }
        if (record.id) {
          result = await updateSpecies.mutateAsync({
            id: record.id,
            ...payload,
          })
        } else {
          result = await createSpecies.mutateAsync(payload)
        }

        if (fromPlantForm) {
          navigate({
            to: '/plants/new',
            search: { plantSpeciesId: result.id },
          })
        } else {
          navigate({
            to: '/catalog/$plantspeciesid',
            params: { plantspeciesid: String(result.id) },
          })
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  return { submitAction, isPending }
}
