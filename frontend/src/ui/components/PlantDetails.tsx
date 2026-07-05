import { addPlantImage, deletePlantImage } from '@/api/plants'
import { useCreateEvent } from '@/api/events'
import type { PlantWithSpecies } from '@/domain/plants/plant'
import { useState, type SyntheticEvent } from 'react'
import { buttonVariants } from '../classVariants/button'
import { cn } from '@sglara/cn'
import { inputVariants } from '../classVariants/input'
import { Link } from '@/router/components/Link'
import DateUtils from '@/utils/dates'

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

  const [editingField, setEditingField] = useState<
    '' | 'nickname' | 'acquiredAt' | 'notes'
  >('')
  const [images, setImages] = useState(plant.images)
  const [editingImages, setEditingImages] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function handleDeleteImage(imageId: number) {
    try {
      await deletePlantImage(plant.id, imageId)
      setImages((prev) => prev.filter((img) => img.id !== imageId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar imagen')
    }
  }

  async function handleAddImage(file: File) {
    setUploading(true)
    try {
      const newImage = await addPlantImage(plant.id, file)
      setImages((prev) => [...prev, newImage])
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al subir imagen')
    } finally {
      setUploading(false)
    }
  }

  //native dialog to change the location
  //dialog should ask for the new location name, the date of the change (default current date) and any notes.
  //to submit the dialog the location name and date must be populated

  async function handleLocationChangeDialogClose(
    e: SyntheticEvent<HTMLDialogElement, Event>
  ) {
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
        // do something here?
        return

      case 'submit':
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

        const res = await createEvent.mutateAsync({
          event_type: 'location_change',
          event_date: registeredAt,
          notes: notes || null,
          metadata: { location },
        })
        form.reset()

        return

      default:
        break
    }
  }

  return (
    <section className="plant-detail mx-3">
      {plant.species.deletedAt && (
        <div className="bg-warning-soft border border-warning-strong text-warning-strong px-4 py-3 rounded-md mb-4">
          Esta planta usa un tipo de planta que ha sido eliminado por su creador
        </div>
      )}
      <input
        type="text"
        name="nickname"
        defaultValue={plant.nickname}
        className={inputVariants({
          className: 'w-full text-3xl',
          disabled: editingField !== 'nickname',
        })}
        onBlur={() => setEditingField('')}
      />

      <div className="flex justify-end mt-2">
        <Link
          to="/catalog/:plantspeciesid/new-plant"
          params={{ plantspeciesid: String(plant.species.id) }}
          className={buttonVariants({ variant: 'secondary', size: 'sm' })}
        >
          Clonar planta
        </Link>
      </div>

      <div className="py-2">
        <hr />
      </div>

      <div className="text-xl grid grid-cols-[auto_1fr] gap-x-3 gap-y-6 items-center mx-auto">
        <div className="grid grid-cols-subgrid col-span-2">
          <span>Tipo:</span>
          <Link to="/catalog" search={{ speciesid: String(plant.species.id) }}>
            <div className="flex gap-2 items-baseline opacity-80">
              <span className="text-xl">{plant.species.commonName}</span>
              <span className="italic text-xs">
                {plant.species.scientificName}
              </span>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-subgrid col-span-2">
          <span>Ubicacion: </span>
          <span className="flex gap-3">
            {plant.location}
            <button
              className={buttonVariants({ variant: 'clean', size: 'sm' })}
              command="show-modal"
              commandfor="create-location-change-dialog"
            >
              Cambiar
            </button>
          </span>
        </div>

        <div className="grid grid-cols-subgrid col-span-2">
          <span>Adquirida en:</span>
          <span>{plant.acquiredAt?.toLocaleDateString() || '-'}</span>
        </div>

        <div className="grid grid-cols-subgrid col-span-2">
          <span>Notas: </span>
          <span>{plant.notes || '-'}</span>
        </div>
      </div>

      <div className="py-2">
        <hr />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium">Imágenes</span>
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
              <div key={image.id} className="relative">
                <img
                  width="200"
                  height="200"
                  className="h-32 w-full object-cover border border-secondary-default rounded-sm"
                  src={image.filepath}
                  alt="Imagen de planta"
                />
                {editingImages && (
                  <button
                    className="absolute left-0 bottom-0 text-sm w-full px-2 py-1 bg-danger-dark/80 text-white"
                    type="button"
                    onClick={() => handleDeleteImage(image.id!)}
                  >
                    Quitar
                  </button>
                )}
              </div>
            ))
          ) : (
            <span className="text-sm text-neutral-default col-span-3">
              Sin imágenes
            </span>
          )}
        </div>

        {editingImages && (
          <label className="inline-block mt-2 cursor-pointer">
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

      <dialog
        closedby="any"
        popover="auto"
        className={cn(
          'mt-8 mx-auto p-4 shadow-lg rounded-md',
          'transition-discrete transition-all duration-300',
          '-translate-y-32 opacity-0 open:translate-y-0 open:opacity-100',
          'starting:open:opacity-0 starting:open:-translate-y-32'
        )}
        id="create-location-change-dialog"
        onClose={handleLocationChangeDialogClose}
      >
        <form method="dialog" className="grid gap-4">
          <label className="grid">
            Lugar:
            <input
              autoComplete="false"
              className={inputVariants()}
              type="text"
              name="new-location"
              placeholder="Ventanal derecho"
              required
            />
          </label>

          <label className="grid">
            Fecha cambio:
            <input
              className={inputVariants()}
              type="date"
              name="new-location-date"
              defaultValue={DateUtils.toInputValue(new Date())}
              required
            />
          </label>

          <label className="grid">
            Notas:
            <textarea
              className={inputVariants()}
              name="new-location-notes"
              placeholder="Por cambio de temporada"
            />
          </label>

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
