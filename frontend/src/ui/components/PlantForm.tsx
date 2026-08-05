import { useTransition, useState, useMemo, useRef, type SubmitEvent } from 'react'
import { buttonVariants } from '@/ui/classVariants/button'
import { useNavigate, Link } from '@tanstack/react-router'
import { cn } from '@sglara/cn'
import { useUpsertPlant, useDeletePlant } from '@/api/plants'
import { useSpecies } from '@/api/species'
import { ImageManagerField, type ImageManagerHandle } from '@/ui/components/ImageManagerField'
import type { PlantWithSpecies } from '@/domain/plants/plant'
import DateUtils from '@/utils/dates'
import { inputVariants } from '@/ui/classVariants/input'

export type PlantFormProps =
  | {
      plantSpeciesId: number
      plant?: never
    }
  | {
      plantSpeciesId?: never
      plant?: PlantWithSpecies
    }

export default function PlantForm({ plant, plantSpeciesId: propsPlantSpeciesId }: PlantFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { data: plantSpecies } = useSpecies()
  const upsertPlant = useUpsertPlant(plant?.id)
  const deletePlant = useDeletePlant()
  const imageManagerRef = useRef<ImageManagerHandle>(null)
  const [isUploading, setIsUploading] = useState(false)

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
        const result = await upsertPlant.mutateAsync({
          nickname: fd.get('nickname')?.toString() || '',
          source: fd.get('source')?.toString() || '',
          location: fd.get('location')?.toString() || undefined,
          acquired_at: fd.get('acquiredAt')?.toString() || undefined,
          notes: fd.get('notes')?.toString() || undefined,
          plant_species_id: plantSpeciesId,
          images: fd.getAll('images').map((v) => v.toString()),
        })

        console.log(
          fd,
          fd.getAll('images'),
          fd.getAll('images').map((v) => v.toString())
        )

        console.log(result)

        await imageManagerRef.current?.commitDeletions()

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

  function handleDelete() {
    if (!plant?.id) return

    const confirmed = confirm(`Esto eliminara la planta "${plant.nickname}". ¿Continuar?`)
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

  const plantSpeciesSelected = plantSpecies?.find((ps) => ps.id === plantSpeciesId)

  return (
    <form
      onSubmit={submit}
      className="mx-4 my-4 p-6 flex flex-col gap-6 bg-surface-raised rounded-xl shadow-sm border border-neutral-subtle/30"
    >
      {error && (
        <div
          className="bg-danger-light border border-danger-subtle text-danger-strong px-4 py-3 rounded-lg text-sm"
          role="alert"
        >
          {error}
        </div>
      )}

      <fieldset>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="plantSpeciesId" className="text-sm font-medium text-neutral-strong">
            Especie
          </label>

          <div className="flex gap-3">
            <select
              value={plantSpeciesId}
              onChange={({ currentTarget: t }) => setPlantSpeciesId(Number(t.value))}
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
              className="bg-primary-subtle text-primary-dark rounded-lg w-32 text-center content-center font-medium hover:bg-primary-default transition-colors"
            >
              Nueva
            </Link>
          </div>
        </div>
      </fieldset>

      <fieldset className="grid gap-6 overflow-auto">
        <ImageManagerField
          ref={imageManagerRef}
          defaultImagePaths={plant?.images.map(({ filepath }) => filepath)}
          imageInputName="images"
          onIsUploadingChange={setIsUploading}
          onImagePathsChange={(v) => console.log(v)}
          maxImages={1}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="nickname" className="text-sm font-medium text-neutral-strong">
            Nombre (apodo)
          </label>
          <input
            className={inputVariants()}
            id="nickname"
            name="nickname"
            type="text"
            defaultValue={plant?.nickname ?? plantSpeciesSelected?.commonName}
            placeholder="Mi monstera del balcón"
            minLength={1}
            disabled={isPending}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="source" className="text-sm font-medium text-neutral-strong">
            Fuente
          </label>
          <input
            className={inputVariants()}
            id="source"
            name="source"
            type="text"
            defaultValue={plant?.source ?? ''}
            placeholder="Regalo, compra, etc."
            minLength={1}
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="location" className="text-sm font-medium text-neutral-strong">
            Ubicación (opcional)
          </label>
          <input
            className={inputVariants()}
            id="location"
            name="location"
            type="text"
            defaultValue={plant?.location ?? ''}
            placeholder="Balcón, sala, habitación..."
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="acquiredAt" className="text-sm font-medium text-neutral-strong">
            Fecha de adquisición (opcional)
          </label>
          <input
            className={inputVariants()}
            id="acquiredAt"
            name="acquiredAt"
            type="date"
            defaultValue={DateUtils.toInputValue(plant?.acquiredAt ?? new Date())}
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="notes" className="text-sm font-medium text-neutral-strong">
            Notas (opcional)
          </label>
          <textarea
            className={inputVariants()}
            id="notes"
            name="notes"
            defaultValue={plant?.notes ?? ''}
            placeholder="Cualquier información adicional..."
            disabled={isPending}
            rows={3}
          />
        </div>
      </fieldset>

      <div className="flex justify-end gap-3">
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
        <div className="text-danger-default border-t border-neutral-subtle/40 pt-6">
          <h3 className="font-semibold mb-3 text-danger-strong">Zona de peligro</h3>
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
