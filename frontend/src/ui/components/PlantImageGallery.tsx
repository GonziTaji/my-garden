import { type ChangeEventHandler } from 'react'
import { buttonVariants } from '../classVariants/button'

interface PlantImageGalleryProps {
  imagePaths: string[]
  editingImages: boolean
  isUploading: boolean
  onToggleEditing: () => void
  onRequestDelete: (filepath: string) => void
  onUpload: ChangeEventHandler<HTMLInputElement>
}

export function PlantImageGallery({
  imagePaths,
  editingImages,
  isUploading,
  onToggleEditing,
  onRequestDelete,
  onUpload,
}: PlantImageGalleryProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-neutral-strong">Imágenes</label>
        <button
          type="button"
          className={buttonVariants({ variant: 'clean', size: 'sm' })}
          onClick={onToggleEditing}
        >
          {editingImages ? 'Cancelar' : 'Editar'}
        </button>
      </div>

      <div className="grid gap-2 grid-cols-3">
        {imagePaths.length > 0 ? (
          imagePaths.map((filepath) => (
            <div key={filepath} className="relative rounded-lg overflow-hidden">
              <img
                width="200"
                height="200"
                className="h-32 w-full object-cover border border-neutral-subtle/30 rounded-lg"
                src={filepath}
                alt="Imagen de planta"
              />
              {editingImages && (
                <button
                  className="absolute left-0 bottom-0 text-sm w-full px-2 py-1.5 bg-danger-dark/80 text-white backdrop-blur-sm rounded-b-lg"
                  type="button"
                  onClick={() => onRequestDelete(filepath)}
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
            {isUploading ? 'Subiendo...' : 'Agregar imagen'}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={isUploading}
            onChange={onUpload}
          />
        </label>
      )}
    </div>
  )
}
