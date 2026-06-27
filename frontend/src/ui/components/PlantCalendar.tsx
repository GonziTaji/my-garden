import { usePlantCalendar, type PlantCalendarEntry } from "@/api/watering"
import type { Plant } from "@/domain/plants/plant"
import DateUtils from "@/utils/dates"
import { cn } from "@sglara/cn"
import { useState, type ChangeEvent, type MouseEvent } from "react"

// calendar grid
const CALENDAR_WEEKS = 6
const CALENDAR_WEEKDAYS = 7

export interface SelectedDay {
  plantId: number,
  date: Date,
  events: PlantCalendarEntry[]
  isWatered?: boolean
}

interface CalendarProps {
  plantId: Plant['id']
  onDaySelect?: (data: SelectedDay) => void
}

interface GridDayData {
  date: Date | null
  events: PlantCalendarEntry[]
  isWatered: boolean
}

export default function PlantCalendar({ plantId, onDaySelect }: CalendarProps) {
  const [monthIndex, setMonthIndex] = useState(() => new Date().getMonth())

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

  if (!calendarData) {
    return <>Unexpected error!</>
  }

  const isWatered = (dateString: string) => (
    !!calendarData?.find((d) => d.date === dateString && d.eventType === 'watering')
  )

  const daysInMonth = Array.from({ length: endDate.getDate() }, (_, i) => {
    const d = new Date(startDate)
    d.setDate(i + 1)
    return d
  })

  const blanksBefore = startDate.getDay()
  const blanksAfter = CALENDAR_WEEKS * CALENDAR_WEEKDAYS - blanksBefore - daysInMonth.length

  const grid: GridDayData[] = [
    ...Array.from({ length: blanksBefore }, () => ({ date: null, events: [], isWatered: false })),

    ...daysInMonth.map(date => ({
      date: date,
      events: calendarData.filter((c) => c.date === DateUtils.toInputValue(date)),
      isWatered: isWatered(DateUtils.toInputValue(date))
    })),

    ...Array.from({ length: blanksAfter }, () => ({ date: null, events: [], isWatered: false })),
  ]

  const months = Array.from({ length: 12 }).fill(null).map((_, i) => {
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

  function handleDayClick(_: MouseEvent<HTMLButtonElement>, gridDayData: GridDayData) {
    if (!gridDayData.date || !onDaySelect) {
      return
    }

    console.log('selected date', gridDayData.date)

    onDaySelect({
      plantId,
      isWatered: gridDayData.isWatered,
      date: gridDayData.date,
      events: gridDayData.events
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
            onClick={(e) => handleDayClick(e, gridDay)}
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
    </div>
  )
}
