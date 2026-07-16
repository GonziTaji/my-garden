import { useTransition, useState, useMemo, useRef, type SubmitEvent } from 'react'
import { buttonVariants } from '@/ui/classVariants/button'
import { cva } from 'class-variance-authority'
import { useNavigate, Link } from '@tanstack/react-router'
import { cn } from '@sglara/cn'
import { useUpsertPlant, useDeletePlant } from '@/api/plants'
import { useSpecies } from '@/api/species'
import { ImageUploader, type ImageUploaderHandle } from './ImageUploader'
import type { PlantWithSpecies } from '@/domain/plants/plant'
import DateUtils from '@/utils/dates'

const inputVariants = cva(
  [
    'border',
    'border-primary-default',
    'outline-primary-default',
    'rounded-lg',
    'min-w-0',
    'w-full',
    'p-2',
  ],
  {
    variants: {},
  }
)

export type PlantFormProps =
  | {
      plantSpeciesId: number
      plant?: never
    }
  | {
      plantSpeciesId?: never
      plant?: PlantWithSpecies
    }

export default function PlantForm({
  plant,
  plantSpeciesId: propsPlantSpeciesId,
}: PlantFormProps) {
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { data: plantSpecies } = useSpecies()
  const upsertPlant = useUpsertPlant(plant?.id)
  const deletePlant = useDeletePlant()
  const imageUploaderRef = useRef<ImageUploaderHandle>(null)

  const ownedSpecies = useMemo(() => {
    if (!plantSpecies) return []
    return plantSpecies.filter((sp) => sp.userId !== undefined)
  }, [plantSpecies])

  const [plantSpeciesId, setPlantSpeciesId] = useState(
    () => plant?.plantSpeciesId || propsPlantSpeciesId || undefined
  )

  async function submit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    if (isUploading || isPending) {
      return
    }

    setError(null)
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        // TODO: validate with zod
        const result = await upsertPlant.mutateAsync({
          nickname: fd.get('nickname')?.toString() || '',
          source: fd.get('source')?.toString() || '',
          location: fd.get('location')?.toString() || undefined,
          acquired_at: fd.get('acquiredAt')?.toString() || undefined,
          notes: fd.get('notes')?.toString() || undefined,
          plant_species_id: plantSpeciesId,
          images: fd.getAll('images').map((entry) => entry.toString()),
        })

        await imageUploaderRef.current?.commitDeletions()

        if (result?.id) {
          navigate({
            to: '/plants/$plantid',
            params: { plantid: String(result.id) },
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error inesperado')
      }
    })
  }

  function handleUploadingImages() {
    setIsUploading(true)
  }

  function handleUploadedImages() {
    setIsUploading(false)
  }

  function handleDelete() {
    if (!plant?.id) return

    const confirmed = confirm(
      `Esto eliminara la planta "${plant.nickname}". ¿Continuar?`
    )
    if (!confirmed) return

    startTransition(async () => {
      try {
        await deletePlant.mutateAsync(plant.id!)
        navigate({ to: '/plants' })
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Error al eliminar')
      }
    })
  }

  return (
    <form
      onSubmit={submit}
      className="mx-8 p-8 flex flex-col gap-8 border border-secondary-subtle"
    >
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      <fieldset>
        <div className="flex flex-col gap-2">
          <label htmlFor="plantSpeciesId">Especie</label>

          <div className="flex gap-3">
            <select
              value={plantSpeciesId}
              onChange={({ currentTarget: t }) =>
                setPlantSpeciesId(Number(t.value))
              }
              name="plantSpecies"
              className={inputVariants()}
            >
              <option value="">Seleccionar especie...</option>
              {ownedSpecies.map((sp) => (
                <option key={sp.id} value={sp.id!}>
                  {sp.commonName}
                </option>
              ))}
            </select>

            <Link
              to="/catalog/new"
              search={{ fromPlantForm: true }}
              className="bg-primary-default rounded-md w-32 text-center content-center"
            >
              Nueva
            </Link>
          </div>
        </div>
      </fieldset>

      <fieldset className="grid gap-8 overflow-auto">
        <ImageUploader
          ref={imageUploaderRef}
          defaultImagePaths={plant?.images.map(({ filepath }) => filepath)}
          inputName="images"
          maxImages={3}
          onUploading={handleUploadingImages}
          onUploaded={handleUploadedImages}
        />

        <div className="flex flex-col gap-2">
          <label htmlFor="nickname">Nombre (apodo)</label>
          <input
            className={inputVariants()}
            id="nickname"
            name="nickname"
            type="text"
            defaultValue={plant?.nickname ?? ''}
            placeholder="Mi monstera del balcon"
            minLength={1}
            disabled={isPending}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="source">Fuente</label>
          <input
            className={inputVariants()}
            id="source"
            name="source"
            type="text"
            defaultValue={plant?.source ?? ''}
            placeholder="Regalo, compra, etc."
            minLength={1}
            disabled={isPending}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="location">Ubicacion (opcional)</label>
          <input
            className={inputVariants()}
            id="location"
            name="location"
            type="text"
            defaultValue={plant?.location ?? ''}
            placeholder="Balcon, sala, habitacion..."
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="acquiredAt">Fecha de adquisicion (opcional)</label>
          <input
            className={inputVariants()}
            id="acquiredAt"
            name="acquiredAt"
            type="date"
            defaultValue={DateUtils.toInputValue(
              plant?.acquiredAt ?? new Date()
            )}
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="notes">Notas (opcional)</label>
          <textarea
            className={inputVariants()}
            id="notes"
            name="notes"
            defaultValue={plant?.notes ?? ''}
            placeholder="Cualquier informacion adicional..."
            disabled={isPending}
            rows={3}
          />
        </div>
      </fieldset>

      <div className="flex justify-end gap-4">
        <button
          className={buttonVariants({ variant: 'secondary' })}
          type="reset"
          disabled={isPending}
          onClick={() => history.go(-1)}
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={isPending || isUploading}
          className={buttonVariants({ variant: 'primary' })}
        >
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      {plant && (
        <div className="text-danger-default border-t border-secondary-subtle pt-6">
          <h3 className="font-semibold mb-2">DANGER ZONE</h3>
          <button
            type="button"
            className={cn(buttonVariants({ variant: 'danger' }))}
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? 'Eliminando...' : 'Eliminar planta'}
          </button>
        </div>
      )}
    </form>
  )
}
