import { Link } from '@/router/components/Link'
import { useToggleWatering, useWateringHistoryRange } from '@/api/watering'
import { usePlants } from '@/api/plants'
import { useTransition } from 'react'
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

const templateColumnsStyle = `repeat(${DEFAULT_DATES_RANGE[0] + DEFAULT_DATES_RANGE[1] - 1}, 1fr)`

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
      <p className="text-center text-gray-500 py-8">
        <span>No hay plantas en tu jardin</span>
        <Link to="/plants/new" className="text-blue-500 hover:underline ml-1">
          Agregar planta
        </Link>
      </p>
    )
  }

  console.log(dates, dates.length, templateColumnsStyle)

  return (
    <div className="text-white px-2">
      <span className='text-center block text-2xl py-4'>Historial de riego</span>

      <div className='overflow-auto'>

        <div className="grid" style={{ gridTemplateColumns: templateColumnsStyle }}>
          {dates.map((date) => (
            <div
              key={date}
              className="p-1 border-b text-center text-xs font-normal text-teal-100"
            >
              {formatDateHeader(date)}
            </div>

          ))}

          {plants.map((plant) => (
            dates
              .map((date) => ({ date, checked: isWatered(plant.id, date) }))
              .map(({ date, checked }) => (
                <div key={date} className="p-1 text-center" data-date={date}>
                  <button
                    type="button"
                    onClick={() => handleWateringClick(plant.id, date)}
                    disabled={isPending}
                    title={`${checked ? "Deshacer" : "Registrar"} riego - ${date}`}
                    className={`
              w-10 h-10 rounded border-2 transition-colors
              ${checked
                        ? "bg-blue-500 border-blue-600 hover:bg-blue-600"
                        : "bg-white border-gray-200 hover:border-blue-300"
                      }
              ${isPending ? "opacity-50" : ""}
              `}
                  >
                    {checked && (
                      <svg className="w-6 h-6 text-white mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              )
              )))}
        </div>
      </div>
    </div>
  )
}

