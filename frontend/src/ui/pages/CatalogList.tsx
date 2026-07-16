import { useSpecies } from '@/api/species'
import SpeciesCatalog from '@/ui/components/SpeciesCatalog'
import { Link, useSearch, useNavigate } from '@tanstack/react-router'
import { buttonVariants } from '@/ui/classVariants/button'
import { useAuth } from '@/auth/AuthContext'
import { cn } from '@sglara/cn'

type Tab = 'mine' | 'favorites' | 'linked' | 'all'

export default function CatalogList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t: tab = 'all' } = useSearch({ from: '/catalog' })

  const scope = tab === 'all' ? (user ? 'mine-favorites' : undefined) : tab
  const { data: species, isLoading, error } = useSpecies(scope)

  const tabs: { key: Tab; label: string }[] = user
    ? [
        { key: 'mine', label: 'Creadas por mí' },
        { key: 'favorites', label: 'Favoritas' },
        { key: 'linked', label: 'De mis plantas' },
        { key: 'all', label: 'Todas' },
      ]
    : [{ key: 'all', label: 'Todas' }]

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="text-neutral-strong">Cargando...</p>
      </div>
    )
  if (error)
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="text-danger-strong">Error al cargar el catálogo</p>
      </div>
    )

  return (
    <div>
      <div className="flex justify-between items-center px-4 pt-5 pb-1">
        <h2 className="text-2xl font-bold text-neutral-dark">Catálogo de plantas</h2>
        {user && (
          <Link to="/catalog/new" className={buttonVariants({ variant: 'primary', size: 'sm' })}>
            Nueva
          </Link>
        )}
      </div>

      <div className="flex gap-1.5 px-4 py-3">
        {tabs.map((t) => (
          <button
            type="button"
            key={t.key}
            onClick={() =>
              navigate({ to: '/catalog', search: { t: t.key === 'all' ? undefined : t.key } })
            }
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
              tab === t.key
                ? 'bg-primary-strong text-white shadow-sm shadow-primary-strong/30'
                : 'text-neutral-strong hover:text-neutral-dark hover:bg-primary-subtle/50'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(species ?? []).length > 0 ? (
        <SpeciesCatalog list={species ?? []} />
      ) : (
        <p className="text-center text-neutral-strong py-12 px-4">
          {tab === 'linked' ? (
            <>No tienes plantas que hagan referencia a ningún tipo de planta todavía.</>
          ) : (
            <>No hay tipos de planta en el catálogo todavía.</>
          )}
          {user && tab === 'mine' && (
            <>
              <br />
              <Link
                to="/catalog/new"
                className="text-primary-dark hover:text-primary-strong hover:underline transition-colors"
              >
                Crear la primera
              </Link>
            </>
          )}
        </p>
      )}
    </div>
  )
}
