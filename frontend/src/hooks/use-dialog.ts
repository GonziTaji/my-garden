import { useEffect, useId, type RefObject } from "react";

type CloseHandler = (returnValue: string | null) => void

const registry: Record<string, CloseHandler> = {
}

document.addEventListener('close', (ev: Event) => {
  if (!ev.target) {
    return
  }

  const node = ev.target as HTMLDialogElement
  if (node.tagName !== 'dialog') {
    return
  }

  if (registry[node.id]) {
    registry[node.id](node.returnValue)
  }
})

interface UseDialogParams {
  dialogRef: RefObject<HTMLDialogElement | null>,
  onClose?: CloseHandler,
  onBeforeClose?: () => void,
  onShow?: () => void,
  onBeforeShow?: () => void
}

export default function useDialog({
  dialogRef,
  onClose,
  onBeforeClose,
  onShow,
  onBeforeShow,
}: UseDialogParams) {
  const id = useId()
  if (dialogRef.current && !dialogRef.current?.id) {
    dialogRef.current.id = id
  }

  useEffect(() => {
    if (!dialogRef.current) {
      return
    }

    if (onClose) {
      registry[dialogRef.current.id] = onClose
    }
  }, [])

  function show() {
    onBeforeShow && onBeforeShow

    if (dialogRef.current?.popover) {
      dialogRef.current?.show()
    } else {
      dialogRef.current?.showModal()
    }
    onShow && onShow()
  }

  function close() {
    onBeforeClose && onBeforeClose()
    dialogRef.current?.close()
  }

  return { show, close }
}

