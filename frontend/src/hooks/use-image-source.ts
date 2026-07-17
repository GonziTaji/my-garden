import useDialog from '@/hooks/use-dialog'
import { useRef, useCallback } from 'react'

const isCaptureSupported =
  typeof document !== 'undefined' && 'capture' in document.createElement('input')

export function useImageSource() {
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

  return { fileInputRef, selectImage, sourceSelectorDialogRef }
}
