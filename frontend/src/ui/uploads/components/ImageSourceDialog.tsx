import type { RefObject } from 'react'
import { cn } from '@sglara/cn'

interface ImageSourceDialogProps {
  dialogRef: RefObject<HTMLDialogElement | null>
  onSelectCapture: () => void
  onSelectGallery: () => void
}

export function ImageSourceDialog({
  dialogRef,
  onSelectCapture,
  onSelectGallery,
}: ImageSourceDialogProps) {
  return (
    <dialog
      ref={dialogRef}
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
        onClick={onSelectCapture}
        className="h-full hover:bg-primary-subtle rounded-xl transition-colors font-medium"
      >
        Cámara
      </button>

      <div className="w-1 bg-neutral-subtle/60 rounded-full h-3/4 self-center" />

      <button
        type="button"
        onClick={onSelectGallery}
        className="h-full hover:bg-primary-subtle rounded-xl transition-colors font-medium"
      >
        Galería
      </button>
    </dialog>
  )
}
