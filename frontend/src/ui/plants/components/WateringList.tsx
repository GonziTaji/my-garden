import { type Plant } from '@/domain/plants/plant'
import { useMemo, useTransition } from 'react'
import { useLastWateredDates, useToggleWatering } from '@/ui/plants/queries/watering'
import { usePlants } from '@/ui/plants/queries/plants'
import { buttonVariants } from '../../class-variants/button'
import { useNavigate } from '@tanstack/react-router'
import DateUtils from '@/utils/dates'

export default function WateringList() {
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
        date: DateUtils.toInputValue(new Date()),
      })
    })
  }

  const formatWateredDate = DateUtils.formatRelativeDate

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
                {p.images[0]?.filepath ? (
                  <img className="h-full w-20 object-cover rounded-lg" src={p.images[0].filepath} />
                ) : (
                  <div className="h-full w-20 rounded-lg bg-primary-light flex items-center justify-center text-xs text-neutral-default">
                    ?
                  </div>
                )}
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
