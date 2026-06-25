import { usePlantCalendar, useQuickWater } from "@/api/watering"
import type { Plant } from "@/domain/plants/plant"
import type { PlantJournalEntry } from "@/domain/plants/plant-journal"
import useDialog from "@/hooks/use-dialog"
import DateUtils from "@/utils/dates"
import { cn } from "@sglara/cn"
import { useRef, useState, type ChangeEvent, type MouseEvent } from "react"

// calendar grid
const CALENDAR_WEEKS = 6
const CALENDAR_WEEKDAYS = 7

interface CalendarProps {
  plantId: Plant['id']
}

interface GridDayData {
  date: Date | null
  isWatered: boolean
}

// interface PopoverPosition {
//   direction: 'up' | 'down'
//   y: number
// }

export default function PlantCalendar({ plantId }: CalendarProps) {
  const [monthIndex, setMonthIndex] = useState(() => new Date().getMonth())
  const [eventsOfDay, setEventsOfDay] = useState<{ date: Date, events: PlantJournalEntry[] }>({ date: new Date(), events: [] })
  const popoverRef = useRef<HTMLDialogElement>(null)
  const { close, show } = useDialog({ dialogRef: popoverRef })
  const quickWater = useQuickWater()

  const startDate = new Date()
  startDate.setMonth(monthIndex)
  startDate.setDate(1)

  const endDate = new Date()
  endDate.setMonth(monthIndex)
  endDate.setDate(DateUtils.getMonthDays(monthIndex + 1))

  const { data: calendarData, error, isLoading } = usePlantCalendar(
    plantId,
    DateUtils.toInputValue(startDate),
    DateUtils.toInputValue(endDate)
  )

  if (error) {
    return <>{error}</>
  }

  if (isLoading) {
    return <>Cargando...</>
  }

  const isWatered = (dateString: string) => (
    !!calendarData?.find((d) => d.date === dateString && d.eventType === 'watering')
  )

  const gridDateTemplate = new Date(startDate)

  const grid: GridDayData[] = new Array(CALENDAR_WEEKS)
    .fill(null)
    .flatMap((_, week) => (
      new Array(CALENDAR_WEEKDAYS)
        .fill(null)
        .map((_, weekday) => {
          if (week === 0 && weekday < startDate.getDay()) {
            return { date: null, isWatered: false };
          }

          if (gridDateTemplate.getDate() >= endDate.getDate()) {
            return { date: null, isWatered: false };
          }

          gridDateTemplate.setDate(gridDateTemplate.getDate() + 1)

          return {
            date: new Date(gridDateTemplate),
            isWatered: isWatered(DateUtils.toInputValue(gridDateTemplate))
          };
        })))

  const months = new Array(12).fill(null).map((_, i) => {
    const d = new Date()
    d.setMonth(i)

    return {
      label: d.toLocaleString('default', { month: 'long' }),
      value: i,
    }
  })

  function handleMonthChange(newMonthIndex: number) {
    setMonthIndex(newMonthIndex)
  }

  function handleMonthSelection(ev: ChangeEvent<HTMLSelectElement>) {
    handleMonthChange(Number(ev.currentTarget.value))
  }

  function handleShowDayDialog(_: MouseEvent<HTMLButtonElement>, gridDayData: GridDayData) {
    if (!gridDayData.date) {
      return
    }

    // clean selection. dialog show only date and create entry button
    // with events: show events as buttons to navigate to them
    // do that with state and so and so

    // show skelleton events until loaded
    const events: PlantJournalEntry[] = []
    if (gridDayData.isWatered) {
      events.push({ date: gridDayData.date, plantId, id: 1, images: [], type: 'watering' })
    }
    setEventsOfDay({ date: gridDayData.date, events })
    show()

    console.log('setting events', events)
  }

  function handleQuickWatering() {
    const dateStr = DateUtils.toInputValue(eventsOfDay.date)
    quickWater.mutate({ plantId, date: dateStr }, {
      onSuccess: () => close()
    })
  }

  return (
    <div>
      <div>
        <button type="button" onClick={() => handleMonthChange(monthIndex - 1)}>&lt;</button>

        <select value={monthIndex} onChange={handleMonthSelection}>
          {months.map(({ label, value }) => (
            <option key={`month-${value}`} value={value}>{label}</option>
          ))}
        </select>

        <button type="button" onClick={() => handleMonthChange(monthIndex + 1)}>&gt;</button>
      </div>

      <div className='grid grid-cols-7 grid-rows-6'>
        {grid.map((gridDay, i) => (
          <button
            type="button"
            onClick={(e) => handleShowDayDialog(e, gridDay)}
            disabled={gridDay.date === null}
            key={`${monthIndex}-${i * 100}`}
            className={cn(
              'text-center',
              gridDay.isWatered && 'bg-blue-400'
            )}
          >
            {gridDay.date?.getDate() || '-'}
          </button>)
        )}
      </div>

      <dialog ref={popoverRef} id="popover1" popover="auto">
        <div className="grid">
          <span>{
            Intl.DateTimeFormat('default', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            }).format(eventsOfDay.date)
          }</span>

          {eventsOfDay.events.map((e) => (
            <div key={e.date.toISOString()}>
              <span>{e.plantId}</span>
              <span>{e.type}</span>
            </div>
          ))}
          {!eventsOfDay.events.find((e) => e.type === 'watering') && (
            <button type="button" onClick={handleQuickWatering} disabled={quickWater.isPending}>riego rapido</button>
          )}
          <button type="button" onClick={close} >close</button>
        </div>
      </dialog>
    </div>
  )
}

