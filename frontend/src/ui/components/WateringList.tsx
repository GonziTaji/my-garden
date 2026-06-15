import { type Plant } from '@/domain/plants/plant'
import { useMemo, useTransition } from 'react'
import { useLastWateredDates, useToggleWatering } from '@/api/watering'
import { usePlants } from '@/api/plants'
import { buttonVariants } from '../classVariants/button'
import { useRouter } from '@/router/provider'

export interface WateringListProps {
}

export default function WateringList({ }: WateringListProps) {
  const toggleWatering = useToggleWatering()
  const { data: plants } = usePlants()
  const { data: lastWateredRaw } = useLastWateredDates(plants?.map(p => p.id) || [])
  const [_, startTransition] = useTransition()
  const router = useRouter()

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
      toggleWatering.mutateAsync({ plant_id: plantid, date: new Date().toLocaleDateString() })
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

    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  }

  const handlePlantImageClick = (plantid: Plant['id']) => {
    router.navigate('/plants/:plantid', { params: { plantid: plantid.toString() } })
  }

  return (
    <div>
      <ul className="grid gap-2 py-4 px-2">
        {(plants || [])
          .map((p) => ({
            ...p,
            lastWatered: lastWateredDates.get(p.id),
            isWateredToday: new Date(lastWateredDates.get(p.id) ?? '').toLocaleDateString() === new Date().toLocaleDateString()
          }))
          .map((p) => (
            <li key={p.id} className="h-28 flex items-center gap-3 border-2 rounded-md border-amber-200/20 bg-amber-100 p-2">
              <button className="h-full" type="button" onClick={() => handlePlantImageClick(p.id)}>
                <img className="h-full aspect-square object-cover rounded-md" src={p.images[0].filepath} />
              </button>

              <div className='grow flex flex-col justify-between h-full p-2'>
                <div className="flex justify-between">
                  <span className="text-xl font-semibold ">{p.nickname}</span>

                  <span className="text-sm italic">
                    Ultimo riego:{' '}
                    {p.lastWatered ? formatWateredDate(p.lastWatered) : "-"}
                  </span>
                </div>

                <div className='flex justify-end gap-2'>
                  <button
                    type="button"
                    onClick={() => handleToggleWaterPlant(p.id)}
                    className={buttonVariants({ variant: p.isWateredToday ? "secondary" : "tertiary" })}
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

export function getSelectedPlantIds(formData: FormData): number[] {
  const plantIdsJson = formData.get('plantIds')?.toString() ?? '[]'
  try {
    return JSON.parse(plantIdsJson) as number[]
  } catch {
    return []
  }
}
