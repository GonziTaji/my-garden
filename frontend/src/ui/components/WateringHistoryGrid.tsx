import { type PlantCalendarEntry } from '@/api/watering'
import { usePlants } from '@/api/plants'
import { useCreateEvent, useDeleteEvent, usePlantEvent } from '@/api/events'
import { plantEventType } from '@/domain/plants/plant-event'
import useDialog from '@/hooks/use-dialog'
import DateUtils from '@/utils/dates'
import { cn } from '@sglara/cn'
import { useRef, useState, type ChangeEvent } from 'react'
import { Link } from '@/router/components/Link'
import PlantCalendar, { type SelectedDay } from './PlantCalendar'
import { buttonVariants } from '../classVariants/button'

export default function WateringHistoryGrid() {
  const [monthIndex, setMonthIndex] = useState(() => new Date().getMonth())
  const [year, setYear] = useState(() => new Date().getFullYear())

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
  const plantOfSelectedEntry = plants?.find(
    (p) => p.id === selectedEntry?.plantId
  )

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

  function handleMonthChange(newMonthIndex: number) {
    console.log({ monthIndex, newMonthIndex })

    if (newMonthIndex === 12) {
      setMonthIndex(0)
      setYear((y) => y + 1)
    } else if (newMonthIndex === -1) {
      setMonthIndex(11)
      setYear((y) => y - 1)
    } else {
      setMonthIndex(newMonthIndex)
    }
  }

  function handleMonthSelection(ev: ChangeEvent<HTMLInputElement>) {
    const [yyyy, mm] = ev.currentTarget.value.split('-')
    console.log(ev.currentTarget.value)
    handleMonthChange(Number(mm))
    setYear(Number(yyyy))
  }

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

  if (isLoadingPlants) return <>Cargando...</>

  if (!plants || plants.length === 0) {
    return (
      <p className="text-center py-8">
        <span>No hay plantas en tu jardin</span>
        <Link to="/plants/new" className="hover:underline ml-1">
          Agregar planta
        </Link>
      </p>
    )
  }

  return (
    <div className="px-2">
      <span className="text-center block text-2xl py-4">
        Historial de riego
      </span>

      <div className="justify-self-center mb-4">
        <button
          type="button"
          onClick={() => handleMonthChange(monthIndex - 1)}
          className="px-2 py-1 border border-secondary-subtle rounded-sm"
        >
          &lt;
        </button>

        <input
          name="month-input"
          type="month"
          onChange={handleMonthSelection}
          className="border border-secondary-subtle rounded-sm w-52 px-2 py-1"
          value={DateUtils.toMonthInputValue(monthIndex, year)}
        />

        <button
          type="button"
          onClick={() => handleMonthChange(monthIndex + 1)}
          className="px-2 py-1 border border-secondary-subtle rounded-sm"
        >
          &gt;
        </button>
      </div>
      <div className="overflow-auto grid grid-cols-[auto_1fr] gap-2">
        {plants.map((plant) => (
          <div
            className="grid col-span-2 grid-cols-subgrid gap-4 rounded-md bg-primary-subtle  p-3"
            key={plant.nickname}
          >
            <div className="flex flex-col max-w-32">
              <span className="text-xl">{plant.nickname}</span>
              <span className="italic">{plant.species.commonName}</span>
              <img
                src={plant.images[0]?.filepath}
                alt={plant.nickname}
                className="border aspect-square w-full border-secondary-subtle rounded-md"
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
          'rounded-t-4xl h-1/2 min-w-screen lg:max-w-xl overflow-auto',

          'transition-all transition-discrete duration-500',
          'top-full starting:top-full starting:open:top-full open:top-1/2',

          'backdrop:transition-opacity backdrop:duration-500',
          'backdrop:opacity-0 starting:open:backdrop:opacity-0 open:backdrop:opacity-100'
        )}
      >
        <div className="px-4 flex flex-col gap-2">
          <div className="flex justify-between items-start align-bottom pt-2">
            <span className="text-center text-lg pt-4">
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
              className="font-semibold text-xl w-8 align-top"
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
              riego rapido
            </button>
          )}

          {selectedDay.events.map((e) => (
            <button
              type="button"
              key={e.id}
              className="py-2 px-4 rounded-md border border-secondary-subtle w-full flex justify-between"
              onClick={() => handleCalendarEntrySelect(e)}
            >
              <span>{plantEventType.meta[e.eventType].label}</span>{' '}
              <span>&gt;</span>
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
                'rounded-full! absolute bottom-0 right-0 m-4 w-12 h-12',
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
          'w-11/12 h-3/4 rounded-4xl m-auto',
          // transitions
          'transition-[transform_opacity] transition-discrete duration-500',
          // translate
          'translate-x-full starting:translate-x-full open:starting:translate-x-full open:translate-0',
          // opacity
          'opacity-0 starting:opacity-0 open:starting:opacity-0 open:opacity-100',
          // backdrop opacity
          'backdrop:transition-opacity backdrop:duration-500',
          'backdrop:opacity-0 open:backdrop:opacity-100 starting:open:backdrop:opacity-0'
        )}
      >
        <div className="grid mx-4 h-full">
          {isLoadingJE && 'Cargando...'}

          {selectedEntry && plantOfSelectedEntry && (
            <div className="p-4 flex flex-col gap-8">
              <div className="grid grid-cols-2 gap-8">
                {plantOfSelectedEntry.images.length > 0 && (
                  <img
                    className="w-full aspect-square object-cover"
                    src={plantOfSelectedEntry.images[0].filepath}
                  />
                )}

                <div className="flex flex-col">
                  <span>{plantOfSelectedEntry.nickname}</span>

                  <span>{plantEventType.meta[selectedEntry?.type].label}</span>

                  <span>
                    {DateUtils.toDisplayDate(new Date(selectedEntry.eventDate))}
                  </span>

                  <span>{selectedEntry.notes || 'Sin notas'}</span>
                </div>
              </div>

              {selectedEntry.images.length > 0 ? (
                selectedEntry.images.map((imgSrc) => (
                  <img key={imgSrc} className="h-48" src={imgSrc} />
                ))
              ) : (
                <span className="">Sin imagenes</span>
              )}

              <div className="grow">&nbsp;</div>

              <div className="flex justify-between">
                <button
                  type="button"
                  className={buttonVariants({ variant: 'danger' })}
                  onClick={handleDeleteEvent}
                  disabled={deleteEvent.isPending}
                >
                  Elimiar evento
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
