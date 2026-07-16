import { useSearch, useNavigate } from '@tanstack/react-router'
import PlantListComponent from '@/ui/components/PlantsList'
import WateringList from '@/ui/components/WateringList'
import WateringHistoryGrid from '@/ui/components/WateringHistoryGrid'
import { cn } from '@sglara/cn'

type Tab = 'list' | 'water' | 'history'

export default function PlantsList() {
  const { t: tab = 'list' } = useSearch({ from: '/plants' })
  const navigate = useNavigate()

  function handleTabChange(newTab: Tab) {
    navigate({ to: '/plants', search: { t: newTab } })
  }

  return (
    <div className="h-full w-full flex flex-col">
      <h2 className="text-2xl font-bold text-secondary-dark p-4">
        Mis plantas
      </h2>

      <div className="flex gap-1 p-2">
        {(['list', 'water', 'history'] as const).map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => handleTabChange(t)}
            className={cn(
              'px-4 py-1 rounded-sm text-sm',
              tab === t
                ? 'bg-primary-subtle text-primary-dark border border-primary-default border-b-white'
                : 'hover:text-secondary-dark'
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
        {tab === 'history' && <WateringHistoryGrid />}
        {tab === 'list' && <PlantListComponent />}
      </div>
    </div>
  )
}
