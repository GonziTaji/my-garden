import type { SyntheticEvent } from 'react'
import { useCreateEvent } from '@/ui/plants/queries/events'
import { buttonVariants } from '../../class-variants/button'
import { cn } from '@sglara/cn'
import { inputVariants } from '../../class-variants/input'
import DateUtils from '@/utils/dates'

interface LocationChangeDialogProps {
  plantId: number
}

const locationChangeActionTypes = {
  cancel: 'cancel',
  submit: 'submit',
} as const

type LocationChangeActionType = keyof typeof locationChangeActionTypes

export function LocationChangeDialog({ plantId }: LocationChangeDialogProps) {
  const createEvent = useCreateEvent(plantId)

  async function handleClose(e: SyntheticEvent<HTMLDialogElement, Event>) {
    e.preventDefault()

    const ct = e.currentTarget
    const form = ct.querySelector('form')
    const action = ct.returnValue as LocationChangeActionType

    if (!form || !action) {
      console.warn('missing form and/or action in dialog close event handler')
      return
    }

    switch (action) {
      case 'cancel':
        form.reset()
        return

      case 'submit': {
        const fd = new FormData(form)

        const location = fd.get('new-location')?.toString() || ''
        const registeredAt = fd.get('new-location-date')?.toString() || ''
        const notes = fd.get('new-location-notes')?.toString() || ''

        if (!location) {
          console.warn('no location in formdata')
          return
        }

        if (!registeredAt) {
          console.warn('no date in formdata')
          return
        }

        await createEvent.mutateAsync({
          event_type: 'location_change',
          event_date: registeredAt,
          notes: notes || null,
          metadata: { location },
        })

        form.reset()

        return
      }

      default:
        break
    }
  }

  return (
    <dialog
      closedby="any"
      popover="auto"
      className={cn(
        'mt-8 mx-auto p-6 rounded-2xl',
        'transition-discrete transition-all duration-300',
        '-translate-y-32 opacity-0 open:translate-y-0 open:opacity-100',
        'starting:open:opacity-0 starting:open:-translate-y-32'
      )}
      id="create-location-change-dialog"
      onClose={handleClose}
    >
      <form method="dialog" className="grid gap-6">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-location" className="text-sm font-medium text-neutral-strong">
            Lugar
          </label>
          <input
            autoComplete="false"
            className={inputVariants()}
            type="text"
            id="new-location"
            name="new-location"
            placeholder="Ventanal derecho"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-location-date" className="text-sm font-medium text-neutral-strong">
            Fecha cambio
          </label>
          <input
            className={inputVariants()}
            type="date"
            id="new-location-date"
            name="new-location-date"
            defaultValue={DateUtils.toInputValue(new Date())}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-location-notes" className="text-sm font-medium text-neutral-strong">
            Notas
          </label>
          <textarea
            className={inputVariants()}
            id="new-location-notes"
            name="new-location-notes"
            placeholder="Por cambio de temporada"
          />
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            className={buttonVariants({ variant: 'secondary' })}
            value={locationChangeActionTypes.cancel}
            formNoValidate
          >
            Cancelar
          </button>
          <button
            type="button"
            className={buttonVariants({ variant: 'primary' })}
            value={locationChangeActionTypes.submit}
          >
            Guardar
          </button>
        </div>
      </form>
    </dialog>
  )
}
