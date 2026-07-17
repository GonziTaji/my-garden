import useDialog from '@/hooks/use-dialog'
import { cn } from '@sglara/cn'
import { useRef, type ChangeEventHandler } from 'react'
import { buttonVariants } from '../classVariants/button'
import { useImageManager } from '@/hooks/use-image-manager'

export interface ImageUploaderProps {
  defaultImagePaths?: string[]
  inputName?: string
  maxImages?: number
  onUploading?: () => void
  onUploaded?: () => void
}

export function ImageUploader({
  defaultImagePaths,
  inputName = 'images',
  maxImages = 3,
  onUploading,
  onUploaded,
}: ImageUploaderProps) {
  const {
    imagePaths,
    previewUrls,
    allowUploads,
    handleImageUpload: rawHandleImageUpload,
    handleRequestDelete,
    handleConfirmDelete,
    closeConfirmDelete,
    deleteDialogRef,
  } = useImageManager({ defaultImagePaths, maxImages })

  const sourceSelectorDialogRef = useRef<HTMLDialogElement>(null)
  const { show: showSourceDialog, close: closeSourceDialog } = useDialog({
    dialogRef: sourceSelectorDialogRef,
  })

  const uploadFilesInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload: ChangeEventHandler<HTMLInputElement> = async (ev) => {
    onUploading?.()
    closeSourceDialog()
    await rawHandleImageUpload(ev)
    onUploaded?.()
  }

  const requestSource = (capture: string | null) => {
    if (!uploadFilesInputRef.current) return
    if (capture) {
      uploadFilesInputRef.current.capture = capture
    } else {
      uploadFilesInputRef.current.removeAttribute('capture')
    }
    uploadFilesInputRef.current.click()
  }

  const handleOpenGallery = () => requestSource(null)
  const handleOpenCamera = () => requestSource('environment')

  return (
    <div className="flex gap-4">
      {allowUploads && (
        <>
          <button
            type="button"
            onClick={showSourceDialog}
            className="aspect-3/4 h-48 border-2 border-dashed border-primary-default/60 rounded-xl flex items-center justify-center text-neutral-strong hover:border-primary-strong hover:bg-primary-light/50 transition-all duration-200 disabled:opacity-10"
          >
            <span className="text-center text-sm">Seleccionar imagen</span>
          </button>

          <input
            onChange={handleImageUpload}
            ref={uploadFilesInputRef}
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
          {`${url}`.startsWith('blob') ? (
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
            <>
              <button
                type="button"
                className="h-full w-full"
                onClick={() => handleRequestDelete(url)}
              >
                <img src={url} alt="image" className="object-cover w-full h-full" />
                <input name={inputName} value={url} type="hidden" />
              </button>
            </>
          )}
        </div>
      ))}

      <dialog
        ref={sourceSelectorDialogRef}
        closedby="any"
        className={cn(
          'fixed text-lg bg-surface-raised gap-1 p-1',
          'min-w-screen self-end lg:max-w-xl',
          'grid grid-cols-[1fr_auto_1fr]',
          'transition-all transition-discrete',
          'h-32 -bottom-32 starting:open:-bottom-32 open:bottom-0',
          'backdrop:opacity-0'
        )}
      >
        <button
          type="button"
          onClick={handleOpenCamera}
          className="h-full hover:bg-primary-subtle rounded-xl transition-colors font-medium"
        >
          Cámara
        </button>

        <div className="w-1 bg-neutral-subtle/60 rounded-full h-3/4 self-center" />

        <button
          type="button"
          onClick={handleOpenGallery}
          className="h-full hover:bg-primary-subtle rounded-xl transition-colors font-medium"
        >
          Galería
        </button>
      </dialog>

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
    </div>
  )
}
