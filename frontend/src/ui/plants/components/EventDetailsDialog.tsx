import type { RefObject } from 'react'
import type { PlantWithSpecies } from '@/domain/plants/plant'
import type { PlantEvent } from '@/domain/plants/plant-event'
import { plantEventType } from '@/domain/plants/plant-event'
import DateUtils from '@/utils/dates'
import { buttonVariants } from '../../class-variants/button'
import { cn } from '@sglara/cn'

interface EventDetailsDialogProps {
  dialogRef: RefObject<HTMLDialogElement | null>
  selectedEntry: PlantEvent | undefined
  plant: PlantWithSpecies | undefined
  isLoading: boolean
  onClose: () => void
  onDelete: () => void
  isDeleting: boolean
}

export function EventDetailsDialog({
  dialogRef,
  selectedEntry,
  plant,
  isLoading,
  onClose,
  onDelete,
  isDeleting,
}: EventDetailsDialogProps) {
  return (
    <dialog
      ref={dialogRef}
      closedby="closerequest"
      className={cn(
        'w-11/12 h-3/4 rounded-3xl m-auto bg-surface-raised',
        'transition-[transform_opacity] transition-discrete duration-500',
        'translate-x-full starting:translate-x-full open:starting:translate-x-full open:translate-0',
        'opacity-0 starting:opacity-0 open:starting:opacity-0 open:opacity-100',
        'backdrop:transition-opacity backdrop:duration-500',
        'backdrop:opacity-0 open:backdrop:opacity-100 starting:open:backdrop:opacity-0'
      )}
    >
      <div className="grid mx-4 h-full">
        {isLoading && (
          <div className="flex justify-center items-center min-h-[40vh]">
            <span className="text-neutral-strong">Cargando...</span>
          </div>
        )}

        {selectedEntry && plant && (
          <div className="p-4 flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-6">
              {plant.images.length > 0 && (
                <img
                  className="w-full aspect-square object-cover rounded-xl"
                  src={plant.images[0]?.filepath}
                />
              )}

              <div className="flex flex-col gap-1">
                <span className="font-semibold text-neutral-dark">
                  {plant.nickname}
                </span>
                <span className="text-primary-dark font-medium">
                  {plantEventType.meta[selectedEntry?.type].label}
                </span>
                <span className="text-neutral-strong text-sm">
                  {DateUtils.toDisplayDate(new Date(selectedEntry.eventDate))}
                </span>
                <span className="text-neutral-strong text-sm italic">
                  {selectedEntry.notes || 'Sin notas'}
                </span>
              </div>
            </div>

            {selectedEntry.images.length > 0 ? (
              selectedEntry.images.map((imgSrc) => (
                <img key={imgSrc} className="h-48 rounded-xl object-cover" src={imgSrc} />
              ))
            ) : (
              <span className="text-neutral-default">Sin imágenes</span>
            )}

            <div className="grow">&nbsp;</div>

            <div className="flex justify-between">
              <button
                type="button"
                className={buttonVariants({ variant: 'danger' })}
                onClick={onDelete}
                disabled={isDeleting}
              >
                Eliminar evento
              </button>

              <button
                type="button"
                className={buttonVariants({ variant: 'secondary' })}
                onClick={onClose}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </dialog>
  )
}
