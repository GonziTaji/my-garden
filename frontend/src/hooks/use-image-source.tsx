import useDialog from '@/hooks/use-dialog'
import { cn } from '@sglara/cn'
import { useMemo, useRef, type ReactNode } from 'react'

// if device can open it's camera. i.e. device is a smartphone/tablet
const isCaptureSupported = 'capture' in document.createElement('input')

export function useImageSource() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sourceSelectorDialogRef = useRef<HTMLDialogElement>(null)
  const { show: showSourceDialog } = useDialog({
    dialogRef: sourceSelectorDialogRef,
  })

  const requestSource = (capture: string | null) => {
    if (!fileInputRef.current) return

    if (capture) {
      fileInputRef.current.capture = capture
    } else {
      fileInputRef.current.removeAttribute('capture')
    }

    fileInputRef.current.click()
  }

  const selectImage = useMemo(
    () => (isCaptureSupported ? showSourceDialog : requestSource),
    [showSourceDialog, requestSource]
  )

  const SourceDialog: ReactNode = (
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
        onClick={() => requestSource('environment')}
        className="h-full hover:bg-primary-subtle rounded-xl transition-colors font-medium"
      >
        Cámara
      </button>

      <div className="w-1 bg-neutral-subtle/60 rounded-full h-3/4 self-center" />

      <button
        type="button"
        onClick={() => requestSource(null)}
        className="h-full hover:bg-primary-subtle rounded-xl transition-colors font-medium"
      >
        Galería
      </button>
    </dialog>
  )

  return { fileInputRef, selectImage, SourceDialog }
}
