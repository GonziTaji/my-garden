import type { PlantDefinition } from "@/domain/plants/plant-definition"
import { type ChangeEventHandler, type FC, useEffect, useState } from "react"

export interface ImageSelectorProps {
  image?: PlantDefinition["images"][number]
  position: number
}

export const ImageSelector: FC<ImageSelectorProps> = ({ image, position }) => {
  const [previewUrl, setPreviewUrl] = useState<string>(image?.filepath ?? "")

  useEffect(() => {
    return () => URL.revokeObjectURL(previewUrl)
  }, [])

  const handleRemoveImage = () => {
    URL.revokeObjectURL(previewUrl)
    setPreviewUrl("")
  }

  const handleOnChangeImage: ChangeEventHandler<HTMLInputElement> = (ev) => {
    URL.revokeObjectURL(previewUrl)

    const maybeFile = ev.currentTarget.files?.item(0)
    if (maybeFile) {
      setPreviewUrl(URL.createObjectURL(maybeFile))
    } else {
      setPreviewUrl("")
    }
  }

  return (
    <div className="flex flex-col gap-2 p-2 rounded-sm">
      <input
        type="hidden"
        name={`imagesExistingId_${position}`}
        value={image?.id ?? ""}
        readOnly
      />
      <input
        type="hidden"
        name={`imagesIsRemoved_${position}`}
        value={previewUrl ? "false" : "true"}
        readOnly
      />

      <label role="button" className="relative h-36 cursor-pointer">
        <input
          name={`imagesFile_${position}`}
          className="hidden"
          type="file"
          accept="image/*"
          onChange={handleOnChangeImage}
        />

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
              className="absolute left-0 bottom-0 text-sm w-full px-2 py-1 bg-slate-900/60 text-white"
              type="button"
              onClick={handleRemoveImage}
            >
              Quitar
            </button>
          </>
        ) : (
          <div className="h-full text-center w-full border border-dashed border-olive-300 grid place-content-center text-sm text-slate-500">
            Agregar imagen
          </div>
        )}
      </label>
    </div>
  )
}
