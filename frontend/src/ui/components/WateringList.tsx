import { type Plant } from '@/domain/plants/plant'
import { useMemo, useTransition } from 'react'
import { useLastWateredDates, useToggleWatering } from '@/api/watering'
import { usePlants } from '@/api/plants'
import { buttonVariants } from '../classVariants/button'
import { useNavigate } from '@tanstack/react-router'

export interface WateringListProps {}

export default function WateringList(_props: WateringListProps) {
  const toggleWatering = useToggleWatering()
  const { data: plants } = usePlants()
  const { data: lastWateredRaw } = useLastWateredDates(plants?.map((p) => p.id) || [])
  const [, startTransition] = useTransition()
  const navigate = useNavigate()

  const lastWateredDates = useMemo(() => {
    const m = new Map<number, string>()
    if (lastWateredRaw) {
      for (const [id, date] of Object.entries(lastWateredRaw)) {
        if (date) m.set(Number(id), date)
      }
    }
    return m
  }, [lastWateredRaw])

  const handleToggleWaterPlant = async (plantid: Plant['id']) => {
    startTransition(() => {
      toggleWatering.mutateAsync({
        plantId: plantid,
        date: new Date().toLocaleDateString(),
      })
    })
  }

  const formatWateredDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Hoy'
    if (diffDays === 1) return 'Ayer'
    if (diffDays < 7) return `Hace ${diffDays} días`

    return date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
    })
  }

  const handlePlantImageClick = (plantid: Plant['id']) => {
    navigate({ to: '/plants/$plantid', params: { plantid: String(plantid) } })
  }

  return (
    <div>
      <ul className="grid gap-3 py-4 px-4">
        {(plants || [])
          .map((p) => ({
            ...p,
            lastWatered: lastWateredDates.get(p.id),
            isWateredToday:
              new Date(lastWateredDates.get(p.id) ?? '').toLocaleDateString() ===
              new Date().toLocaleDateString(),
          }))
          .map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-4 rounded-xl bg-surface-raised border border-neutral-subtle/30 shadow-sm p-3 transition-all duration-200 hover:shadow-md"
            >
              <button
                className="h-20 shrink-0"
                type="button"
                onClick={() => handlePlantImageClick(p.id)}
              >
                <img className="h-full w-20 object-cover rounded-lg" src={p.images[0].filepath} />
              </button>

              <div className="grow flex flex-col justify-between h-full py-1">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-lg font-semibold text-neutral-dark">{p.nickname}</span>

                  <span className="text-xs text-neutral-strong shrink-0">
                    Último riego: {p.lastWatered ? formatWateredDate(p.lastWatered) : '-'}
                  </span>
                </div>

                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleToggleWaterPlant(p.id)}
                    className={buttonVariants({
                      variant: p.isWateredToday ? 'secondary' : 'primary',
                      size: 'sm',
                    })}
                  >
                    {p.isWateredToday ? 'Revertir' : 'Regar'}
                  </button>
                </div>
              </div>
            </li>
          ))}
      </ul>
    </div>
  )
}
