import { Link } from '@/router/components/Link'
import { useToggleWatering, useWateringHistoryRange } from '@/api/watering'
import { usePlants } from '@/api/plants'
import { useState, useTransition, type ChangeEvent } from 'react'
import type { Plant } from '@/domain/plants/plant'
import DateUtils from '@/utils/dates'

interface WateringHistoryGridProps {
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()

  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'

  // undefined = client's locale
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit"
  })
}

const DEFAULT_DATES_RANGE = [13, 0]

export default function WateringHistoryGrid({ }: WateringHistoryGridProps) {
  const dates = DateUtils.getDateRange(DEFAULT_DATES_RANGE[0], DEFAULT_DATES_RANGE[1]).toReversed()

  const { data: plants } = usePlants()
  const { data: wateredMap } = useWateringHistoryRange(plants?.map(p => p.id) || [], dates[dates.length - 1], dates[0])

  // from and to in UI, date range in state? 
  const [isPending, startTransition] = useTransition()
  const toggleWatering = useToggleWatering()

  function isWatered(plantId: Plant["id"], date: string) {
    return (wateredMap?.get(plantId) ?? new Set()).has(date)
  }

  const handleWateringClick = (plantId: Plant["id"], date: string) => {
    startTransition(async () => {
      try {
        await toggleWatering.mutateAsync({ plant_id: plantId, date })
      } catch {
        // silently fail — could show toast in future
      }
    })
  }

  if (!plants || !wateredMap) return null

  if (plants.length === 0) {
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
      <span className='text-center block text-2xl py-4'>Historial de riego</span>

      <div className='overflow-auto'>
        {plants.map((plant) => (
          <div key={plant.nickname}>
            <div>{plant.nickname}</div>
            <Calendar />
          </div>
        ))}
      </div>
    </div>
  )
}

// calendar grid
const CALENDAR_WEEKS = 6
const CALENDAR_WEEKDAYS = 7

function Calendar() {
  const [monthIndex, setMonthIndex] = useState(() => new Date().getMonth())

  const d = new Date()
  d.setMonth(monthIndex)
  const initialDay = d.getDay()
  console.log(initialDay)

  const daysCount = getMonthDays(monthIndex + 1 as NumericMonth)
  let currentDay = 0

  const grid = new Array(CALENDAR_WEEKS)
    .fill(null)
    .map((_, week) => (
      new Array(CALENDAR_WEEKDAYS)
        .fill(null)
        .map((_, weekday) => {
          if (week === 0 && weekday < initialDay) {
            return null;
          }

          if (currentDay >= daysCount) {
            return null;
          }

          currentDay++;
          return currentDay;
        })))
    .flatMap(x => x.map(y => y))

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

  console.log(grid)

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
        {grid.map((day, i) => <p key={`${monthIndex}-${day || i * 100}`}> {day || '-'}</p>)}
      </div>
    </div >
  )
}

type NumericMonth = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
function getMonthDays(numericMonth: NumericMonth) {
  if (numericMonth === 2) {
    const YYYY = new Date().getFullYear()
    if (YYYY % 100 === 0) {
      if (YYYY % 400 === 0) {
        return 29
      }
    } else if (YYYY % 4 === 0) {
      return 29
    }

    return 28
  }

  switch (numericMonth) {
    case 1:
    case 3:
    case 5:
    case 7:
    case 8:
    case 10:
    case 12:
      return 31;

    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
  }
}
