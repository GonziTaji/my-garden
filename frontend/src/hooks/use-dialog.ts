import type { RefObject } from "react";

const useDialog = (dialog: RefObject<HTMLDialogElement | null>) => {
  function openAsModal() {
    dialog.current?.showModal()
  }

  function close() {
    dialog.current?.close()
  }

  return { openAsModal, close }
}

export default useDialog
