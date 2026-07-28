import { useSearch, useNavigate } from '@tanstack/react-router'
import PlantGrid from '@/ui/components/PlantGrid'
import WateringList from '@/ui/components/WateringList'
import { cn } from '@sglara/cn'
import WateringHistoryGridv2 from '../components/WateringHistoryGridv2'

type Tab = 'list' | 'water' | 'history'

export default function PlantsList() {
  const { t: tab = 'list' } = useSearch({ from: '/plants' })
  const navigate = useNavigate()

  function handleTabChange(newTab: Tab) {
    navigate({ to: '/plants', search: { t: newTab } })
  }

  return (
    <div className="h-full w-full flex flex-col">
      <h2 className="text-2xl font-bold text-neutral-dark px-4 pt-5 pb-1">Mis plantas</h2>

      <div className="flex gap-1.5 px-4 py-3">
        {(['list', 'water', 'history'] as const).map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => handleTabChange(t)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
              tab === t
                ? 'bg-primary-strong text-white shadow-sm shadow-primary-strong/30'
                : 'text-neutral-strong hover:text-neutral-dark hover:bg-primary-subtle/50'
            )}
          >
            {t === 'list' && 'Mi Jardín'}
            {t === 'water' && 'Regar'}
            {t === 'history' && 'Historial'}
          </button>
        ))}
      </div>

      <div className="grow">
        {tab === 'water' && <WateringList />}
        {tab === 'history' && <WateringHistoryGridv2 />}
        {tab === 'list' && <PlantGrid />}
      </div>
    </div>
  )
}
