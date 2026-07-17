import type { PlantWithSpecies } from '@/domain/plants/plant'
import { useState, type ChangeEventHandler } from 'react'
import { buttonVariants } from '../classVariants/button'
import { inputVariants } from '../classVariants/input'
import { Link, useNavigate } from '@tanstack/react-router'
import { useImageManager } from '@/hooks/use-image-manager'
import { PlantImageGallery } from './PlantImageGallery'
import { LocationChangeDialog } from './LocationChangeDialog'

interface PlantDetailProps {
  plant: PlantWithSpecies
}

export default function PlantDetails({ plant }: PlantDetailProps) {
  const [editingField, setEditingField] = useState<'nickname' | 'acquiredAt' | 'notes' | null>(null)
  const [editingImages, setEditingImages] = useState(false)

  const {
    imagePaths,
    handleRequestDelete,
    handleConfirmDelete,
    closeConfirmDelete,
    deleteDialogRef,
    handleImageUpload,
    isUploading,
  } = useImageManager({
    defaultImagePaths: plant.images.map(({ filepath }) => filepath),
  })

  const navigate = useNavigate()

  const handleUpload: ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.currentTarget.files?.item(0)
    if (file) {
      const dt = new DataTransfer()
      dt.items.add(file)
      const syntheticEvent = {
        currentTarget: { files: dt.files },
      } as React.ChangeEvent<HTMLInputElement>
      handleImageUpload(syntheticEvent)
    }
    e.currentTarget.value = ''
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
          onBlur={() => setEditingField(null)}
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

      <PlantImageGallery
        imagePaths={imagePaths}
        editingImages={editingImages}
        isUploading={isUploading}
        onToggleEditing={() => setEditingImages(!editingImages)}
        onRequestDelete={handleRequestDelete}
        onUpload={handleUpload}
      />

      <div className="flex justify-end gap-4">
        <Link
          to="/catalog/$plantspeciesid/new-plant"
          params={{ plantspeciesid: String(plant.species.id) }}
          className={buttonVariants({ variant: 'secondary' })}
        >
          Clonar planta
        </Link>
      </div>

      <LocationChangeDialog plantId={plant.id} />

      <dialog
        ref={deleteDialogRef}
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
              onClick={handleConfirmDelete}
            >
              Confirmar
            </button>

            <button
              type="button"
              onClick={closeConfirmDelete}
              className={buttonVariants({ variant: 'secondary' })}
            >
              Cancelar
            </button>
          </div>
        </div>
      </dialog>
    </section>
  )
}
