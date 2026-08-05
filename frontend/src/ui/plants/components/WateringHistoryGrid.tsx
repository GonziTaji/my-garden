import { usePlants } from '@/ui/plants/queries/plants'
import { useCreateEvent, useDeleteEvent, usePlantEvent } from '@/ui/plants/queries/events'
import useDialog from '@/ui/shared/hooks/use-dialog'
import DateUtils from '@/utils/dates'
import { useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import PlantCalendar, { type SelectedDay } from './PlantCalendar'
import { DaySummaryDialog } from './DaySummaryDialog'
import { EventDetailsDialog } from './EventDetailsDialog'
import { useMonthSelector } from '@/ui/shared/hooks/use-month-selector'
import { QueryState } from '@/ui/shared/components/QueryState'

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

  function handleCalendarEntrySelect(entry: { id: string | number }) {
    showEventDetails()
    setSelectedEntryId(Number(entry.id))
  }

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
    <QueryState isLoading={isLoadingPlants}>
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

        <DaySummaryDialog
          dialogRef={daySummaryRef}
          selectedDay={selectedDay}
          onClose={closeDaySummary}
          onQuickWatering={handleQuickWatering}
          onEventSelect={handleCalendarEntrySelect}
          isCreating={createEvent.isPending}
          isDeleting={deleteEvent.isPending}
        />

        <EventDetailsDialog
          dialogRef={eventDetailsRef}
          selectedEntry={selectedEntry}
          plant={plantOfSelectedEntry}
          isLoading={isLoadingJE}
          onClose={closeEventDetails}
          onDelete={handleDeleteEvent}
          isDeleting={deleteEvent.isPending}
        />
      </div>
    </QueryState>
  )
}
