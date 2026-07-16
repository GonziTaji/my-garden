import { type PlantCalendarEntry } from '@/api/watering'
import { usePlants } from '@/api/plants'
import { useCreateEvent, useDeleteEvent, usePlantEvent } from '@/api/events'
import { plantEventType } from '@/domain/plants/plant-event'
import useDialog from '@/hooks/use-dialog'
import DateUtils from '@/utils/dates'
import { cn } from '@sglara/cn'
import { useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import PlantCalendar, { type SelectedDay } from './PlantCalendar'
import { buttonVariants } from '../classVariants/button'
import { useMonthSelector } from '@/hooks/use-month-selector'

export default function WateringHistoryGrid() {
  const { monthIndex, year, setPreviousMonth, setNextMonth, handleInputMonthChange } =
    useMonthSelector({})

  const { data: plants, isLoading: isLoadingPlants } = usePlants()

  const [selectedDay, setSelectedDay] = useState<SelectedDay>({
    plantId: 0,
    date: new Date(),
    events: [],
  })

  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null)
  const { data: selectedEntry, isLoading: isLoadingJE } = usePlantEvent(
    selectedDay.plantId,
    selectedEntryId ?? 0
  )
  const plantOfSelectedEntry = plants?.find((p) => p.id === selectedEntry?.plantId)

  const daySummaryRef = useRef<HTMLDialogElement>(null)
  const { close: closeDaySummary, show: showDaySummary } = useDialog({
    dialogRef: daySummaryRef,
  })

  const eventDetailsRef = useRef<HTMLDialogElement>(null)
  const { close: closeEventDetails, show: showEventDetails } = useDialog({
    dialogRef: eventDetailsRef,
  })

  const createEvent = useCreateEvent(selectedDay.plantId)
  const deleteEvent = useDeleteEvent(selectedDay.plantId)

  function handleDaySelect(data: SelectedDay) {
    if (daySummaryRef.current?.open) {
      closeDaySummary()
      return
    }

    setSelectedDay(data)

    if (!daySummaryRef.current?.open) {
      showDaySummary()
    }
  }

  function handleQuickWatering() {
    const dateStr = DateUtils.toInputValue(selectedDay.date)

    createEvent.mutate(
      {
        event_type: 'watering',
        event_date: dateStr,
        notes: '',
      },
      { onSuccess: closeDaySummary }
    )
  }

  function handleDeleteEvent() {
    if (!selectedEntry) {
      return
    }

    deleteEvent.mutate(selectedEntry.id, {
      onSuccess: () => {
        closeEventDetails()
        closeDaySummary()
        setSelectedEntryId(null)
      },
    })
  }

  function handleCalendarEntrySelect(entry: PlantCalendarEntry) {
    showEventDetails()
    setSelectedEntryId(Number(entry.id))
  }

  if (isLoadingPlants)
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <p className="text-neutral-strong">Cargando...</p>
      </div>
    )

  if (!plants || plants.length === 0) {
    return (
      <p className="text-center py-12 text-neutral-strong">
        <span>No hay plantas en tu jardín</span>
        <Link
          to="/plants/new"
          className="text-primary-dark hover:text-primary-strong hover:underline ml-1 transition-colors"
        >
          Agregar planta
        </Link>
      </p>
    )
  }

  return (
    <div className="px-4">
      <span className="text-center block text-xl font-semibold text-neutral-dark py-4">
        Historial de riego
      </span>

      <div className="justify-self-center mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={setPreviousMonth}
          className="px-3 py-1.5 border border-neutral-subtle/60 rounded-lg bg-surface-raised hover:bg-primary-subtle transition-colors text-sm"
        >
          &lt;
        </button>

        <input
          name="month-input"
          type="month"
          onChange={handleInputMonthChange}
          className="border border-neutral-subtle/60 rounded-lg w-52 px-3 py-1.5 bg-surface-raised text-sm focus:outline-none focus:border-primary-strong focus:ring-2 focus:ring-primary-subtle transition-all"
          value={DateUtils.toMonthInputValue(monthIndex, year)}
        />

        <button
          type="button"
          onClick={setNextMonth}
          className="px-3 py-1.5 border border-neutral-subtle/60 rounded-lg bg-surface-raised hover:bg-primary-subtle transition-colors text-sm"
        >
          &gt;
        </button>
      </div>
      <div className="overflow-auto grid grid-cols-[auto_1fr] gap-3">
        {plants.map((plant) => (
          <div
            className="grid col-span-2 grid-cols-subgrid gap-4 rounded-xl bg-surface-raised p-4 border border-neutral-subtle/30 shadow-sm"
            key={plant.nickname}
          >
            <div className="flex flex-col max-w-32 gap-1">
              <span className="text-lg font-semibold text-neutral-dark">{plant.nickname}</span>
              <span className="text-sm italic text-neutral-strong">{plant.species.commonName}</span>
              <img
                src={plant.images[0]?.filepath}
                alt={plant.nickname}
                className="border aspect-square w-full border-neutral-subtle/30 rounded-lg object-cover mt-1"
              />
            </div>

            <div className="w-full">
              <PlantCalendar
                plantId={plant.id}
                onDaySelect={handleDaySelect}
                monthIndex={monthIndex}
                year={year}
              />
            </div>
          </div>
        ))}
      </div>
      <dialog
        ref={daySummaryRef}
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
              onClick={closeDaySummary}
              className="font-semibold text-xl w-8 align-top text-neutral-strong hover:text-neutral-dark transition-colors"
            >
              &times;
            </button>
          </div>

          {!selectedDay.isWatered && (
            <button
              type="button"
              onClick={handleQuickWatering}
              className={buttonVariants({ variant: 'primary' })}
              disabled={createEvent.isPending || deleteEvent.isPending}
            >
              Riego rápido
            </button>
          )}

          {selectedDay.events.map((e) => (
            <button
              type="button"
              key={e.id}
              className="py-2.5 px-4 rounded-lg border border-neutral-subtle/30 bg-surface-raised w-full flex justify-between items-center hover:bg-primary-subtle/50 hover:border-primary-default transition-all"
              onClick={() => handleCalendarEntrySelect(e)}
            >
              <span className="text-neutral-dark">{plantEventType.meta[e.eventType].label}</span>
              <span className="text-neutral-default">&gt;</span>
            </button>
          ))}

          <button
            type="button"
            onClick={handleQuickWatering}
            disabled={createEvent.isPending || deleteEvent.isPending}
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
      <dialog
        ref={eventDetailsRef}
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
          {isLoadingJE && (
            <div className="flex justify-center items-center min-h-[40vh]">
              <span className="text-neutral-strong">Cargando...</span>
            </div>
          )}

          {selectedEntry && plantOfSelectedEntry && (
            <div className="p-4 flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-6">
                {plantOfSelectedEntry.images.length > 0 && (
                  <img
                    className="w-full aspect-square object-cover rounded-xl"
                    src={plantOfSelectedEntry.images[0]?.filepath}
                  />
                )}

                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-neutral-dark">
                    {plantOfSelectedEntry.nickname}
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
                  onClick={handleDeleteEvent}
                  disabled={deleteEvent.isPending}
                >
                  Eliminar evento
                </button>

                <button
                  type="button"
                  className={buttonVariants({ variant: 'secondary' })}
                  onClick={closeEventDetails}
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </dialog>
    </div>
  )
}
