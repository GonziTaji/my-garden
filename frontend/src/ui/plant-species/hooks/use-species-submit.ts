import { useNavigate } from '@tanstack/react-router'
import type { PlantSpecies } from '@/domain/plants/plant-species'
import { useCreateSpecies, useUpdateSpecies } from '@/ui/plant-species/queries/species'
import { useTransition, type FormEvent } from 'react'

interface UseSpeciesSubmitParams {
  record: PlantSpecies
  fromPlantForm?: boolean
  imagePaths: string[]
  commitDeletions: () => Promise<void>
}

export function useSpeciesSubmit({ record, fromPlantForm, imagePaths, commitDeletions }: UseSpeciesSubmitParams) {
  const navigate = useNavigate()
  const createSpecies = useCreateSpecies()
  const updateSpecies = useUpdateSpecies()
  const [isPending, startTransition] = useTransition()

  const submitHandler = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (isPending) return

    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        const images = imagePaths.map((filepath, index) => ({
          filepath,
          position: index,
        }))

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

        await commitDeletions()

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

  return { submitHandler, isPending }
}
