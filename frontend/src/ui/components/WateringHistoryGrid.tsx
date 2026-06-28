import { type PlantCalendarEntry } from "@/api/watering"
import { usePlants } from '@/api/plants'
import { useCreateEvent, useDeleteEvent, usePlantEvent } from "@/api/events"
import { plantEventType } from "@/domain/plants/plant-event"
import useDialog from "@/hooks/use-dialog"
import DateUtils from "@/utils/dates"
import { cn } from "@sglara/cn"
import { useRef, useState } from "react"
import { Link } from '@/router/components/Link'
import PlantCalendar, { type SelectedDay } from './PlantCalendar'

export default function WateringHistoryGrid() {
  const { data: plants, isLoading: isLoadingPlants } = usePlants()

  const [selectedDay, setSelectedDay] = useState<SelectedDay>({
    plantId: 0,
    date: new Date(),
    events: []
  })

  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null)
  const { data: selectedEntry, isLoading: isLoadingJE } = usePlantEvent(selectedDay.plantId, selectedEntryId ?? 0)

  const daySummaryRef = useRef<HTMLDialogElement>(null)
  const { close: closeDaySummary, show: showDaySummary } = useDialog({ dialogRef: daySummaryRef })

  const eventDetailsRef = useRef<HTMLDialogElement>(null)
  const { close: closeEventDetails, show: showEventDetails } = useDialog({ dialogRef: eventDetailsRef })

  const createEvent = useCreateEvent(selectedDay.plantId)
  const deleteEvent = useDeleteEvent(selectedDay.plantId)

  function handleDaySelect(data: SelectedDay) {
    if (daySummaryRef.current?.open) {
      closeDaySummary()
      return;
    }

    setSelectedDay(data)

    if (!daySummaryRef.current?.open) {
      showDaySummary()
    }
  }

  function handleQuickWatering() {
    const dateStr = DateUtils.toInputValue(selectedDay.date)

    createEvent.mutate({
      event_type: 'watering',
      event_date: dateStr,
      notes: '',
    })
  }

  function handleDeleteEvent(e: PlantCalendarEntry) {
    deleteEvent.mutate(Number(e.id))
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

  function handleCalendarEntrySelect(entry: PlantCalendarEntry) {
    showEventDetails()
    setSelectedEntryId(Number(entry.id))
  }

  return (
    <div className="px-2">
      <span className='text-center block text-2xl py-4'>Historial de riego</span>

      <div className='overflow-auto grid grid-cols-[auto_1fr]'>
        {plants.map((plant) => (
          <div className='grid col-span-2 grid-cols-subgrid gap-4' key={plant.nickname}>
            <div className='w-min'>
              <span>{plant.nickname}</span>
              <img src={plant.images[0]?.filepath} alt={plant.nickname} />
            </div>

            <div className='w-full'>
              <PlantCalendar plantId={plant.id} onDaySelect={handleDaySelect} />
            </div>
          </div>
        ))}
      </div>

      <dialog
        ref={daySummaryRef}
        closedby="any"
        className={cn(
          "rounded-t-4xl h-2/3 min-w-screen lg:max-w-xl",

          "transition-all transition-discrete duration-500",
          "top-full starting:top-full starting:open:top-full open:top-2/3",

          "backdrop:transition-opacity backdrop:duration-500",
          "backdrop:opacity-0 starting:open:backdrop:opacity-0 open:backdrop:opacity-100",
        )}
      >
        <div className="grid mx-4 mt-4">
          <span className="text-center">{
            Intl.DateTimeFormat('default', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            }).format(selectedDay.date)
          }</span>

          {selectedDay.events.map((e) => (
            <button key={e.id} onClick={() => handleCalendarEntrySelect(e)}>
              {plantEventType.meta[e.eventType].label}
            </button>
          ))}

          {!selectedDay.isWatered && (
            <button
              type="button"
              onClick={handleQuickWatering}
              disabled={createEvent.isPending || deleteEvent.isPending}
            >
              riego rapido
            </button>
          )}

          <button type="button" onClick={closeDaySummary}>Cerrar</button>
        </div>
      </dialog>

      <dialog
        ref={eventDetailsRef}
        closedby="any"
        className={cn(
          "w-11/12 h-11/12 rounded-4xl m-auto",
          // transitions
          "transition-[transform_opacity] transition-discrete duration-500",
          // translate
          "translate-x-full starting:translate-x-full open:starting:translate-x-full open:translate-0",
          // opacity
          "opacity-0 starting:opacity-0 open:starting:opacity-0 open:opacity-100",
          // backdrop opacity
          "backdrop:transition-opacity backdrop:duration-500",
          "backdrop:opacity-0 open:backdrop:opacity-100 starting:open:backdrop:opacity-0",
        )}
      >
        <div className="grid mx-4 mt-4">
          {isLoadingJE ? 'cargando...' : JSON.stringify(selectedEntry)}

          <button type="button" onClick={closeEventDetails}>Cerrar</button>
        </div>
      </dialog>
    </div>
  )
}
