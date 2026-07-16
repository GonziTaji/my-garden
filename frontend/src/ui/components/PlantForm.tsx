import {
  useTransition,
  useState,
  useMemo,
  useRef,
  useEffect,
  type ChangeEventHandler,
  type SubmitEvent,
} from 'react'
import { buttonVariants } from '@/ui/classVariants/button'
import { cva } from 'class-variance-authority'
import { useNavigate, Link } from '@tanstack/react-router'
import { cn } from '@sglara/cn'
import { useUpsertPlant, useDeletePlant } from '@/api/plants'
import { useSpecies } from '@/api/species'
import { useImageUploads } from '@/api/uploads'
import { useImageSource } from '@/hooks/use-image-source'
import useDialog from '@/hooks/use-dialog'
import type { PlantWithSpecies } from '@/domain/plants/plant'
import DateUtils from '@/utils/dates'

const inputVariants = cva(
  [
    'transition-all',
    'duration-200',
    'border',
    'border-neutral-subtle/60',
    'rounded-lg',
    'min-w-0',
    'w-full',
    'p-2.5',
    'bg-surface-raised',
    'text-neutral-dark',
    'placeholder:text-neutral-default',
    'focus:outline-none',
    'focus:border-primary-strong',
    'focus:ring-2',
    'focus:ring-primary-subtle',
    'hover:border-neutral-default',
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

export default function PlantForm({ plant, plantSpeciesId: propsPlantSpeciesId }: PlantFormProps) {
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { data: plantSpecies } = useSpecies()
  const upsertPlant = useUpsertPlant(plant?.id)
  const deletePlant = useDeletePlant()
  const { uploadImage, deleteImage } = useImageUploads()
  const { fileInputRef, selectImage, SourceDialog } = useImageSource()

  const [imagePaths, setImagePaths] = useState<string[]>(
    plant?.images.map(({ filepath }) => filepath) ?? []
  )
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [deletedPaths, setDeletedPaths] = useState<string[]>([])

  const deleteImageDialogRef = useRef<HTMLDialogElement>(null)
  const { show: showConfirmDeleteImageDialog, close: closeConfirmDeleteImageDialog } = useDialog({
    dialogRef: deleteImageDialogRef,
  })

  const deleteTargetImagePath = useRef('')

  const maxImages = 3
  const imagesCount = imagePaths.length + previewUrls.length
  const allowUploads = imagesCount < maxImages

  useEffect(() => {
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
          images: fd.getAll('images').map((entry) => entry.toString()),
        })

        const results = await Promise.all(deletedPaths.map((path) => deleteImage(path)))
        const errors = results.filter((r) => r.error)
        if (errors.length !== 0) {
          alert('Error al eliminar una o más imágenes')
        }
        setDeletedPaths([])

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

  const handleImageUpload: ChangeEventHandler<HTMLInputElement> = async (ev) => {
    if (!allowUploads || !ev.currentTarget.files) return

    const files: File[] = [...ev.currentTarget.files].splice(0, maxImages - imagesCount)

    setPreviewUrls(files.map((f) => URL.createObjectURL(f)))
    setIsUploading(true)

    const ress = await Promise.all(
      files.map(async (file, fileIndex) => {
        const { filepath, error } = await uploadImage(file)
        if (error) return { error }

        setImagePaths((state) => [...state, filepath])

        const previewUrl = previewUrls[fileIndex]
        URL.revokeObjectURL(previewUrl)
        setPreviewUrls((state) => state.filter((blob) => blob !== previewUrl))
      })
    )

    const errors = ress.filter((r) => r && r.error)
    if (errors.length !== 0) {
      alert('Error al subir una o más imágenes')
    }

    setIsUploading(false)
  }

  const handleRequestDeleteImage = (imagePath: string) => {
    deleteTargetImagePath.current = imagePath
    showConfirmDeleteImageDialog()
  }

  const handleConfirmDeleteImage = () => {
    setDeletedPaths((state) => [...state, deleteTargetImagePath.current])
    setImagePaths(imagePaths.filter((path) => path !== deleteTargetImagePath.current))
    deleteTargetImagePath.current = ''
    closeConfirmDeleteImageDialog()
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
        <div className="flex gap-4">
          {allowUploads && (
            <>
              <button
                type="button"
                onClick={() => selectImage(null)}
                className="aspect-3/4 h-48 border-2 border-dashed border-primary-default/60 rounded-xl flex items-center justify-center text-neutral-strong hover:border-primary-strong hover:bg-primary-light/50 transition-all duration-200 disabled:opacity-10"
              >
                <span className="text-center text-sm">Seleccionar imagen</span>
              </button>

              <input
                onChange={handleImageUpload}
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
              />
            </>
          )}

          {[...previewUrls, ...imagePaths].map((url) => (
            <div
              key={url}
              className="aspect-3/4 h-48 border border-neutral-subtle/30 rounded-xl overflow-hidden"
            >
              {url.startsWith('blob') ? (
                <div className="h-full w-full grid grid-cols-1 grid-rows-1">
                  <img src={url} alt="image" className="col-1 row-1 object-cover" />
                  <span
                    className={cn(
                      'text-white bg-neutral-dark/60 h-full w-full font-semibold text-center content-center',
                      'col-1 row-1 text-sm self-center justify-self-center backdrop-blur-sm'
                    )}
                  >
                    Cargando
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  className="h-full w-full"
                  onClick={() => handleRequestDeleteImage(url)}
                >
                  <img src={url} alt="image" className="object-cover w-full h-full" />
                  <input name="images" value={url} type="hidden" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="nickname" className="text-sm font-medium text-neutral-strong">
            Nombre (apodo)
          </label>
          <input
            className={inputVariants()}
            id="nickname"
            name="nickname"
            type="text"
            defaultValue={plant?.nickname ?? ''}
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
            required
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

      {SourceDialog}

      <dialog
        ref={deleteImageDialogRef}
        className="max-w-xl top-1/3 py-8 px-8 bg-surface-raised rounded-2xl"
      >
        <div className="flex flex-col gap-8">
          <span className="text-xl text-center font-medium text-neutral-dark">
            ¿Quieres eliminar esta foto?
          </span>

          <div className="flex gap-6 justify-center">
            <button
              className={buttonVariants({ variant: 'primary' })}
              type="button"
              onClick={handleConfirmDeleteImage}
            >
              Confirmar
            </button>

            <button
              type="button"
              onClick={closeConfirmDeleteImageDialog}
              className={buttonVariants({ variant: 'secondary' })}
            >
              Cancelar
            </button>
          </div>
        </div>
      </dialog>
    </form>
  )
}
