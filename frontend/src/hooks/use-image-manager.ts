import { useState, useRef, useEffect, useCallback, type ChangeEventHandler } from 'react'
import { useImageUploads } from '@/api/uploads'
import useDialog from '@/hooks/use-dialog'

interface UseImageManagerParams {
  defaultImagePaths?: string[]
  maxImages?: number
}

interface UseImageManagerReturn {
  imagePaths: string[]
  previewUrls: string[]
  allowUploads: boolean
  imagesCount: number
  maxImages: number
  handleImageUpload: ChangeEventHandler<HTMLInputElement>
  handleRequestDelete: (imagePath: string) => void
  handleConfirmDelete: () => void
  commitDeletions: () => Promise<void>
  closeConfirmDelete: () => void
  deleteDialogRef: React.RefObject<HTMLDialogElement | null>
  isUploading: boolean
}

export function useImageManager(params?: UseImageManagerParams): UseImageManagerReturn {
  const defaultImagePaths = params?.defaultImagePaths ?? []
  const maxImages = params?.maxImages ?? 3

  const [imagePaths, setImagePaths] = useState<string[]>(defaultImagePaths)
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [deletedPaths, setDeletedPaths] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const { uploadImage, deleteImage } = useImageUploads()

  const deleteImageDialogRef = useRef<HTMLDialogElement>(null)
  const { show: showConfirmDeleteImageDialog, close: closeConfirmDeleteImageDialog } = useDialog({
    dialogRef: deleteImageDialogRef,
  })

  const deleteTargetImagePath = useRef('')

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

  const handleImageUpload: ChangeEventHandler<HTMLInputElement> = useCallback(
    async (ev) => {
      if (!allowUploads || !ev.currentTarget.files) return

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
    [allowUploads, maxImages, imagesCount, uploadImage]
  )

  const handleRequestDelete = useCallback(
    (imagePath: string) => {
      deleteTargetImagePath.current = imagePath
      showConfirmDeleteImageDialog()
    },
    [showConfirmDeleteImageDialog]
  )

  const handleConfirmDelete = useCallback(() => {
    setDeletedPaths((state) => [...state, deleteTargetImagePath.current])
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

  return {
    imagePaths,
    previewUrls,
    allowUploads,
    imagesCount,
    maxImages,
    handleImageUpload,
    handleRequestDelete,
    handleConfirmDelete,
    commitDeletions,
    closeConfirmDelete: closeConfirmDeleteImageDialog,
    deleteDialogRef: deleteImageDialogRef,
    isUploading,
  }
}
