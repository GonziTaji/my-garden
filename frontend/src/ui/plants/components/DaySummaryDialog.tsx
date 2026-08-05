import type { RefObject } from 'react'
import type { SelectedDay } from './PlantCalendar'
import { plantEventType } from '@/domain/plants/plant-event'
import { buttonVariants } from '../../class-variants/button'
import { cn } from '@sglara/cn'

interface DaySummaryDialogProps {
  dialogRef: RefObject<HTMLDialogElement | null>
  selectedDay: SelectedDay
  onClose: () => void
  onQuickWatering: () => void
  onEventSelect: (entry: { id: string | number; eventType: string }) => void
  isCreating: boolean
  isDeleting: boolean
}

export function DaySummaryDialog({
  dialogRef,
  selectedDay,
  onClose,
  onQuickWatering,
  onEventSelect,
  isCreating,
  isDeleting,
}: DaySummaryDialogProps) {
  const isDisabled = isCreating || isDeleting

  return (
    <dialog
      ref={dialogRef}
      closedby="closerequest"
      className={cn(
        'rounded-t-3xl h-1/2 min-w-screen lg:max-w-xl overflow-auto bg-surface-raised',

        'transition-all transition-discrete duration-500',
        'top-full starting:top-full starting:open:top-full open:top-1/2',

        'backdrop:transition-opacity backdrop:duration-500',
        'backdrop:opacity-0 starting:open:backdrop:opacity-0 open:backdrop:opacity-100'
      )}
    >
      <div className="px-4 flex flex-col gap-3">
        <div className="flex justify-between items-start align-bottom pt-2">
          <span className="text-center text-lg font-medium text-neutral-dark pt-4">
            {Intl.DateTimeFormat('default', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            }).format(selectedDay.date)}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="font-semibold text-xl w-8 align-top text-neutral-strong hover:text-neutral-dark transition-colors"
          >
            &times;
          </button>
        </div>

        {!selectedDay.isWatered && (
          <button
            type="button"
            onClick={onQuickWatering}
            className={buttonVariants({ variant: 'primary' })}
            disabled={isDisabled}
          >
            Riego rápido
          </button>
        )}

        {selectedDay.events.map((e) => (
          <button
            type="button"
            key={e.id}
            className="py-2.5 px-4 rounded-lg border border-neutral-subtle/30 bg-surface-raised w-full flex justify-between items-center hover:bg-primary-subtle/50 hover:border-primary-default transition-all"
            onClick={() => onEventSelect(e)}
          >
            <span className="text-neutral-dark">{plantEventType.meta[e.eventType].label}</span>
            <span className="text-neutral-default">&gt;</span>
          </button>
        ))}

        <button
          type="button"
          onClick={onQuickWatering}
          disabled={isDisabled}
          className={buttonVariants({
            variant: 'primary',
            size: 'sm',
            className:
              'rounded-full! fixed bottom-6 right-6 w-14 h-14 text-xl shadow-lg shadow-primary-strong/40 z-10',
          })}
        >
          +
        </button>
      </div>
    </dialog>
  )
}
