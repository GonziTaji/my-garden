import { useCalendarEvents } from '@/api/events'
import type { Plant } from '@/domain/plants/plant'
import type { PlantCalendarEntry } from '@/api/watering'
import DateUtils from '@/utils/dates'
import { cn } from '@sglara/cn'
import { type MouseEvent } from 'react'

const CALENDAR_WEEKS = 6
const CALENDAR_WEEKDAYS = 7

export interface SelectedDay {
  plantId: number
  date: Date
  events: PlantCalendarEntry[]
  isWatered?: boolean
}

interface CalendarProps {
  plantId: Plant['id']
  monthIndex: number
  year: number
  onDaySelect?: (data: SelectedDay) => void
}

interface GridDayData {
  date: Date | null
  events: PlantCalendarEntry[]
  isToday?: boolean
  isWatered?: boolean
}

export default function PlantCalendar({ plantId, onDaySelect, monthIndex, year }: CalendarProps) {
  const startDate = new Date()
  startDate.setMonth(monthIndex)
  startDate.setFullYear(year)
  startDate.setDate(1)

  const endDate = new Date()
  endDate.setMonth(monthIndex)
  endDate.setFullYear(year)
  endDate.setDate(DateUtils.getMonthDays(monthIndex + 1))

  const {
    data: calendarData,
    error,
    isLoading,
  } = useCalendarEvents(plantId, DateUtils.toInputValue(startDate), DateUtils.toInputValue(endDate))

  if (error) {
    return <>{error}</>
  }

  const isWatered = (dateString: string) =>
    !!calendarData?.find((d) => d.date === dateString && d.eventType === 'watering')

  const daysInMonth = Array.from({ length: endDate.getDate() }, (_, i) => {
    const d = new Date(startDate)
    d.setDate(i + 1)
    return d
  })

  const blanksBefore = startDate.getDay()
  const blanksAfter = CALENDAR_WEEKS * CALENDAR_WEEKDAYS - blanksBefore - daysInMonth.length

  const grid: GridDayData[] = [
    ...Array.from({ length: blanksBefore }, () => ({ date: null, events: [] })),

    ...daysInMonth.map((date) => ({
      date: date,
      isToday: new Date().toDateString() === date.toDateString(),
      events: calendarData?.filter((c) => c.date === DateUtils.toInputValue(date)) || [],
      isWatered: isWatered(DateUtils.toInputValue(date)),
    })),

    ...Array.from({ length: blanksAfter }, () => ({ date: null, events: [] })),
  ]

  function handleDayClick(_: MouseEvent<HTMLButtonElement>, gridDayData: GridDayData) {
    if (!gridDayData.date || !onDaySelect) {
      return
    }

    onDaySelect({
      plantId,
      isWatered: gridDayData.isWatered,
      date: gridDayData.date,
      events: gridDayData.events,
    })
  }

  return (
    <div className={cn('transition-opacity delay-200', isLoading && 'opacity-20')}>
      <div className="grid grid-cols-7 grid-rows-6">
        {grid.map((gridDay, i) => (
          <button
            type="button"
            onClick={(e) => handleDayClick(e, gridDay)}
            disabled={gridDay.date === null || isLoading}
            key={gridDay.date?.toString() || i}
            className={cn(
              'text-center  w-8 h-8 rounded-lg cursor-pointer text-sm transition-all duration-150',
              gridDay.date === null && 'cursor-default',
              gridDay.isToday &&
                !gridDay.isWatered &&
                'border-2 border-primary-strong font-semibold text-primary-dark',
              gridDay.isWatered && 'bg-primary-strong text-white font-medium',
              !gridDay.isToday &&
                !gridDay.isWatered &&
                gridDay.date !== null &&
                'hover:bg-primary-subtle'
            )}
          >
            {gridDay.date?.getDate() || '-'}
          </button>
        ))}
      </div>
    </div>
  )
}
