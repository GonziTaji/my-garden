import {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  type ChangeEventHandler,
} from 'react'
import { useAllowedMimeTypes, useImageUploads } from '@/ui/uploads/queries/uploads'
import useDialog from '@/ui/shared/hooks/use-dialog'
import { ImageSourceDialog } from '@/ui/uploads/components/ImageSourceDialog'
import { ImageDeleteDialog } from '@/ui/uploads/components/ImageDeleteDialog'
import { cn } from '@sglara/cn'

const isCaptureSupported =
  typeof document !== 'undefined' && 'capture' in document.createElement('input')

export interface ImageManagerHandle {
  commitDeletions: () => Promise<void>
}

interface ImageManagerFieldProps {
  defaultImagePaths?: string[]
  maxImages?: number
  imageInputName?: string
  readOnly?: boolean
  onIsUploadingChange?: (isUploading: boolean) => void
  onImagePathsChange?: (paths: string[]) => void
}

export const ImageManagerField = forwardRef<ImageManagerHandle, ImageManagerFieldProps>(
  function ImageManagerField(
    {
      defaultImagePaths = [],
      maxImages = 3,
      imageInputName,
      readOnly = false,
      onIsUploadingChange,
      onImagePathsChange,
    },
    ref
  ) {
    const [imagePaths, setImagePaths] = useState<string[]>(defaultImagePaths)
    const [previewUrls, setPreviewUrls] = useState<string[]>([])
    const [deletedPaths, setDeletedPaths] = useState<string[]>([])
    const [isUploading, setIsUploading] = useState(false)

    const { uploadImage, deleteImage } = useImageUploads()
    const { data: mimetypes } = useAllowedMimeTypes()

    const deleteImageDialogRef = useRef<HTMLDialogElement>(null)
    const { show: showConfirmDeleteImageDialog, close: closeConfirmDeleteImageDialog } = useDialog({
      dialogRef: deleteImageDialogRef,
    })

    const deleteTargetImagePath = useRef('')

    const fileInputRef = useRef<HTMLInputElement>(null)
    const sourceSelectorDialogRef = useRef<HTMLDialogElement>(null)
    const { show: showSourceDialog } = useDialog({ dialogRef: sourceSelectorDialogRef })

    const requestSource = useCallback((capture: string | null) => {
      if (!fileInputRef.current) return
      if (capture) {
        fileInputRef.current.capture = capture
      } else {
        fileInputRef.current.removeAttribute('capture')
      }
      fileInputRef.current.click()
    }, [])

    const selectImage = isCaptureSupported ? showSourceDialog : requestSource

    const imagesCount = imagePaths.length + previewUrls.length
    const allowUploads = imagesCount < maxImages

    const previewUrlsRef = useRef(previewUrls)

    useEffect(() => {
      previewUrlsRef.current = previewUrls
    })

    useEffect(() => {
      return () => {
        previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      }
    }, [])

    useEffect(() => {
      onIsUploadingChange?.(isUploading)
    }, [isUploading, onIsUploadingChange])

    useEffect(() => {
      onImagePathsChange?.(imagePaths)
    }, [imagePaths, onImagePathsChange])

    const handleImageUpload: ChangeEventHandler<HTMLInputElement> = useCallback(
      async (ev) => {
        if (readOnly || !allowUploads || !ev.currentTarget.files) return

        const files: File[] = [...ev.currentTarget.files].splice(0, maxImages - imagesCount)

        setPreviewUrls(files.map((f) => URL.createObjectURL(f)))
        setIsUploading(true)

        const results = await Promise.allSettled(
          files.map(async (file, fileIndex) => {
            const filepath = await uploadImage(file)

            setImagePaths((state) => [...state, filepath])

            const previewUrl = previewUrlsRef.current[fileIndex]
            URL.revokeObjectURL(previewUrl)
            setPreviewUrls((state) => state.filter((blob) => blob !== previewUrl))
          })
        )

        const errors = results.filter((r) => r.status === 'rejected')
        if (errors.length !== 0) {
          alert('Error al subir una o más imágenes')
        }

        setIsUploading(false)
      },
      [readOnly, allowUploads, maxImages, imagesCount, uploadImage]
    )

    const handleRequestDelete = useCallback(
      (imagePath: string) => {
        if (readOnly) return
        deleteTargetImagePath.current = imagePath
        showConfirmDeleteImageDialog()
      },
      [readOnly, showConfirmDeleteImageDialog]
    )

    const handleConfirmDelete = useCallback(() => {
      setDeletedPaths((state) => [...state, deleteTargetImagePath.current])

      console.log(deleteTargetImagePath.current)
      console.log(imagePaths.filter((path) => path !== deleteTargetImagePath.current))

      setImagePaths((paths) => paths.filter((path) => path !== deleteTargetImagePath.current))

      deleteTargetImagePath.current = ''

      closeConfirmDeleteImageDialog()
    }, [closeConfirmDeleteImageDialog])

    const commitDeletions = useCallback(async () => {
      const results = await Promise.allSettled(deletedPaths.map((path) => deleteImage(path)))
      const errors = results.filter((r) => r.status === 'rejected')
      if (errors.length !== 0) {
        alert('Error al eliminar una o más imágenes')
      }
      setDeletedPaths([])
    }, [deletedPaths, deleteImage])

    useImperativeHandle(
      ref,
      () => ({
        commitDeletions,
      }),
      [commitDeletions]
    )

    const displayedImagePaths = imagePaths.filter((imgPath) => !deletedPaths.includes(imgPath))

    return (
      <>
        <div className="flex gap-4">
          {!readOnly && allowUploads && (
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
                accept={mimetypes?.join(',')}
                multiple={maxImages > 1}
                hidden
              />

              <ImageSourceDialog
                dialogRef={sourceSelectorDialogRef}
                onSelectCapture={() => selectImage('environment')}
                onSelectGallery={() => selectImage(null)}
              />
            </>
          )}

          {[...previewUrls, ...displayedImagePaths].map((url) => (
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
                  onClick={() => handleRequestDelete(url)}
                  disabled={readOnly}
                >
                  <img src={url} alt="image" className="object-cover w-full h-full" />
                  {imageInputName && <input name={imageInputName} value={url} type="hidden" />}
                </button>
              )}
            </div>
          ))}
        </div>

        {!readOnly && (
          <ImageDeleteDialog
            dialogRef={deleteImageDialogRef}
            onConfirm={handleConfirmDelete}
            onClose={closeConfirmDeleteImageDialog}
          />
        )}
      </>
    )
  }
)
