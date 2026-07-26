import type { RefObject } from 'react'
import { buttonVariants } from '@/ui/classVariants/button'

interface ImageDeleteDialogProps {
  dialogRef: RefObject<HTMLDialogElement | null>
  onConfirm: () => void
  onClose: () => void
}

export function ImageDeleteDialog({ dialogRef, onConfirm, onClose }: ImageDeleteDialogProps) {
  return (
    <dialog
      ref={dialogRef}
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
            onClick={onConfirm}
          >
            Confirmar
          </button>

          <button
            type="button"
            onClick={onClose}
            className={buttonVariants({ variant: 'secondary' })}
          >
            Cancelar
          </button>
        </div>
      </div>
    </dialog>
  )
}
