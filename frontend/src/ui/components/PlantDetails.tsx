import { useCreateEvent } from '@/api/events'
import type { PlantWithSpecies } from '@/domain/plants/plant'
import { useState, type SyntheticEvent } from 'react'
import { buttonVariants } from '../classVariants/button'
import { cn } from '@sglara/cn'
import { inputVariants } from '../classVariants/input'
import { Link, useNavigate } from '@tanstack/react-router'
import DateUtils from '@/utils/dates'
import { useImageUploads } from '@/api/uploads'

interface PlantDetailProps {
  plant: PlantWithSpecies
}

const locationChangeActionTypes = {
  cancel: 'cancel',
  submit: 'submit',
} as const

type LocationChangeActionType = keyof typeof locationChangeActionTypes

export default function PlantDetails({ plant }: PlantDetailProps) {
  const createEvent = useCreateEvent(plant.id)

  const [editingField, setEditingField] = useState<'' | 'nickname' | 'acquiredAt' | 'notes'>('')
  const [images, setImages] = useState(plant.images)
  const [editingImages, setEditingImages] = useState(false)
  const [uploading, setUploading] = useState(false)
  const { uploadImage, deleteImage } = useImageUploads()
  const navigate = useNavigate()

  async function handleDeleteImage(imagePath: string) {
    try {
      await deleteImage(imagePath)
      setImages((prev) => prev.filter((img) => img.filepath !== imagePath))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar imagen')
    }
  }

  async function handleAddImage(file: File) {
    setUploading(true)
    try {
      const { error, filepath } = await uploadImage(file)
      if (error) {
        alert(typeof error === 'string' ? error : error?.error || 'Error al subir imagen')
        return
      }

      setImages((prev) => [...prev, { id: null, plantId: plant.id, filepath, createdAt: '' }])
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al subir imagen')
    } finally {
      setUploading(false)
    }
  }

  async function handleLocationChangeDialogClose(e: SyntheticEvent<HTMLDialogElement, Event>) {
    e.preventDefault()

    const ct = e.currentTarget
    const form = ct.querySelector('form')
    const action = ct.returnValue as LocationChangeActionType

    if (!form || !action) {
      console.warn('missing form and/or action in dialog close event handler')
      return
    }

    switch (action) {
      case 'cancel':
        form.reset()
        return

      case 'submit': {
        const fd = new FormData(form)

        const location = fd.get('new-location')?.toString() || ''
        const registeredAt = fd.get('new-location-date')?.toString() || ''
        const notes = fd.get('new-location-notes')?.toString() || ''

        if (!location) {
          console.warn('no location in formdata')
          return
        }

        if (!registeredAt) {
          console.warn('no date in formdata')
          return
        }

        await createEvent.mutateAsync({
          event_type: 'location_change',
          event_date: registeredAt,
          notes: notes || null,
          metadata: { location },
        })

        form.reset()

        return
      }

      default:
        break
    }
  }

  return (
    <section className="mx-4 my-4 p-6 flex flex-col gap-6 bg-surface-raised rounded-xl shadow-sm border border-neutral-subtle/30">
      {plant.species.deletedAt && (
        <div className="bg-danger-light border border-danger-subtle text-danger-strong px-4 py-3 rounded-lg text-sm">
          Esta planta usa un tipo de planta que ha sido eliminado por su creador
        </div>
      )}

      <button
        className={buttonVariants({ variant: 'secondary' })}
        type="button"
        onClick={() =>
          navigate({
            to: '/plants/$plantid/edit',
            params: { plantid: String(plant.id) },
          })
        }
      >
        Editar
      </button>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="nickname" className="text-sm font-medium text-neutral-strong">
          Nombre (apodo)
        </label>
        <input
          type="text"
          id="nickname"
          name="nickname"
          defaultValue={plant.nickname}
          className={inputVariants({
            disabled: editingField !== 'nickname',
          })}
          onBlur={() => setEditingField('')}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-strong">Tipo</label>
        <Link to="/catalog">
          <div className="flex gap-2 items-baseline group">
            <span className="text-lg font-medium text-neutral-dark group-hover:text-primary-dark transition-colors">
              {plant.species.commonName}
            </span>
            <span className="italic text-xs text-neutral-strong">
              {plant.species.scientificName}
            </span>
          </div>
        </Link>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-strong">Ubicación</label>
        <span className="flex gap-3 items-center">
          <span className="text-neutral-dark">{plant.location}</span>
          <button
            className={buttonVariants({ variant: 'clean', size: 'sm' })}
            command="show-modal"
            commandfor="create-location-change-dialog"
          >
            Cambiar
          </button>
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-strong">Adquirida en</label>
        <span className="text-neutral-dark">{plant.acquiredAt?.toLocaleDateString() || '-'}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-strong">Notas</label>
        <span className="text-neutral-dark">{plant.notes || '-'}</span>
      </div>

      <hr className="border-neutral-subtle/40" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-neutral-strong">Imágenes</label>
          {editingImages ? (
            <button
              type="button"
              className={buttonVariants({ variant: 'clean', size: 'sm' })}
              onClick={() => setEditingImages(false)}
            >
              Cancelar
            </button>
          ) : (
            <button
              type="button"
              className={buttonVariants({ variant: 'clean', size: 'sm' })}
              onClick={() => setEditingImages(true)}
            >
              Editar
            </button>
          )}
        </div>

        <div className="grid gap-2 grid-cols-3">
          {images.length > 0 ? (
            images.map((image) => (
              <div key={image.id ?? image.filepath} className="relative rounded-lg overflow-hidden">
                <img
                  width="200"
                  height="200"
                  className="h-32 w-full object-cover border border-neutral-subtle/30 rounded-lg"
                  src={image.filepath}
                  alt="Imagen de planta"
                />
                {editingImages && (
                  <button
                    className="absolute left-0 bottom-0 text-sm w-full px-2 py-1.5 bg-danger-dark/80 text-white backdrop-blur-sm rounded-b-lg"
                    type="button"
                    onClick={() => handleDeleteImage(image.filepath)}
                  >
                    Quitar
                  </button>
                )}
              </div>
            ))
          ) : (
            <span className="text-sm text-neutral-default col-span-3">Sin imágenes</span>
          )}
        </div>

        {editingImages && (
          <label className="inline-block cursor-pointer">
            <span className={buttonVariants({ variant: 'clean', size: 'sm' })}>
              {uploading ? 'Subiendo...' : 'Agregar imagen'}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.currentTarget.files?.item(0)
                if (file) handleAddImage(file)
                e.currentTarget.value = ''
              }}
            />
          </label>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <Link
          to="/catalog/$plantspeciesid/new-plant"
          params={{ plantspeciesid: String(plant.species.id) }}
          className={buttonVariants({ variant: 'secondary' })}
        >
          Clonar planta
        </Link>
      </div>

      <dialog
        closedby="any"
        popover="auto"
        className={cn(
          'mt-8 mx-auto p-6 rounded-2xl',
          'transition-discrete transition-all duration-300',
          '-translate-y-32 opacity-0 open:translate-y-0 open:opacity-100',
          'starting:open:opacity-0 starting:open:-translate-y-32'
        )}
        id="create-location-change-dialog"
        onClose={handleLocationChangeDialogClose}
      >
        <form method="dialog" className="grid gap-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-location" className="text-sm font-medium text-neutral-strong">
              Lugar
            </label>
            <input
              autoComplete="false"
              className={inputVariants()}
              type="text"
              id="new-location"
              name="new-location"
              placeholder="Ventanal derecho"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-location-date" className="text-sm font-medium text-neutral-strong">
              Fecha cambio
            </label>
            <input
              className={inputVariants()}
              type="date"
              id="new-location-date"
              name="new-location-date"
              defaultValue={DateUtils.toInputValue(new Date())}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-location-notes" className="text-sm font-medium text-neutral-strong">
              Notas
            </label>
            <textarea
              className={inputVariants()}
              id="new-location-notes"
              name="new-location-notes"
              placeholder="Por cambio de temporada"
            />
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              className={buttonVariants({ variant: 'secondary' })}
              value={locationChangeActionTypes.cancel}
              formNoValidate
            >
              Cancelar
            </button>
            <button
              type="button"
              className={buttonVariants({ variant: 'primary' })}
              value={locationChangeActionTypes.submit}
            >
              Guardar
            </button>
          </div>
        </form>
      </dialog>
    </section>
  )
}
