import type { PlantSpecies } from '@/domain/plants/plant-species'
import { useImageSource } from '@/hooks/use-image-source'
import { ImageSourceDialog } from '@/ui/components/ImageSourceDialog'
import { type ChangeEventHandler, type FC, useEffect, useRef, useState } from 'react'

export interface ImageSelectorProps {
  image?: PlantSpecies['images'][number]
  position: number
}

export const ImageSelector: FC<ImageSelectorProps> = ({ image, position }) => {
  const [previewUrl, setPreviewUrl] = useState<string>(image?.filepath ?? '')
  const { fileInputRef, selectImage, sourceSelectorDialogRef } = useImageSource()

  const previewUrlRef = useRef(previewUrl)

  useEffect(() => {
    previewUrlRef.current = previewUrl
  })

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  const handleRemoveImage = () => {
    URL.revokeObjectURL(previewUrl)
    setPreviewUrl('')
  }

  const handleOnChangeImage: ChangeEventHandler<HTMLInputElement> = (ev) => {
    URL.revokeObjectURL(previewUrl)

    const maybeFile = ev.currentTarget.files?.item(0)
    if (maybeFile) {
      setPreviewUrl(URL.createObjectURL(maybeFile))
    } else {
      setPreviewUrl('')
    }
  }

  return (
    <div className="flex flex-col gap-2 p-2 rounded-xl">
      <input type="hidden" name={`imagesExistingId_${position}`} value={image?.id ?? ''} readOnly />
      <input
        type="hidden"
        name={`imagesIsRemoved_${position}`}
        value={previewUrl ? 'false' : 'true'}
        readOnly
      />

      <input
        ref={fileInputRef}
        name={`imagesFile_${position}`}
        className="hidden"
        type="file"
        accept="image/*"
        onChange={handleOnChangeImage}
      />

      <div
        role="button"
        className="relative h-36 cursor-pointer rounded-xl overflow-hidden"
        onClick={previewUrl ? undefined : () => selectImage(null)}
      >
        {previewUrl ? (
          <>
            <img
              className="h-full w-full object-cover"
              src={previewUrl}
              alt=""
              width={150}
              height={150}
            />

            <button
              className="absolute left-0 bottom-0 text-sm w-full px-2 py-1.5 bg-neutral-dark/70 text-white backdrop-blur-sm rounded-b-xl"
              type="button"
              onClick={handleRemoveImage}
            >
              Quitar
            </button>
          </>
        ) : (
          <div className="h-full text-center w-full border border-dashed border-primary-default/60 rounded-xl grid place-content-center text-sm text-neutral-strong hover:border-primary-strong hover:bg-primary-light/50 transition-all">
            Agregar imagen
          </div>
        )}
      </div>

      <ImageSourceDialog
        dialogRef={sourceSelectorDialogRef}
        onSelectCapture={() => selectImage('environment')}
        onSelectGallery={() => selectImage(null)}
      />
    </div>
  )
}
