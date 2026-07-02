import { useDefinitions } from '@/api/definitions'
import DefinitionsCatalog from '@/ui/components/DefinitionsCatalog'
import { Link } from '@/router/components/Link'
import { buttonVariants } from '@/ui/classVariants/button'
import { useAuth } from '@/auth/AuthContext'
import { useSearchParams } from '@/router/provider'
import { cn } from '@sglara/cn'

type Tab = 'mine' | 'favorites' | 'linked' | 'all'

export default function CatalogList() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get('t') as Tab) || 'all'

  const scope = tab === 'all' ? (user ? 'mine-favorites' : undefined) : tab
  const { data: definitions, isLoading, error } = useDefinitions(scope)

  const tabs: { key: Tab; label: string }[] = user
    ? [
        { key: 'mine', label: 'Creadas por mi' },
        { key: 'favorites', label: 'Favoritas' },
        { key: 'linked', label: 'De mis plantas' },
        { key: 'all', label: 'Todas' },
      ]
    : [{ key: 'all', label: 'Todas' }]

  if (isLoading)
    return (
      <div className="p-8 text-center text-secondary-strong">Cargando...</div>
    )
  if (error)
    return (
      <div className="p-8 text-center text-danger-strong">
        Error al cargar el catálogo
      </div>
    )

  return (
    <div>
      <div className="flex justify-between items-center p-4">
        <h2 className="text-2xl font-bold text-secondary-dark">
          Catálogo de plantas
        </h2>
        {user && (
          <Link
            to="/catalog/new"
            className={buttonVariants({ variant: 'primary' })}
          >
            Nueva
          </Link>
        )}
      </div>

      <div className="flex gap-1 p-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setSearchParams({ t: t.key === 'all' ? '' : t.key })}
            className={cn(
              'px-4 py-1 rounded-sm text-sm',
              tab === t.key
                ? 'bg-primary-subtle text-primary-dark border border-primary-default'
                : 'hover:text-secondary-dark'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(definitions ?? []).length > 0 ? (
        <DefinitionsCatalog list={definitions ?? []} />
      ) : (
        <p className="text-center text-secondary-strong py-12">
          {tab === 'linked' ? (
            <>
              No tienes plantas que hagan referencia a ningun tipo de planta
              todavia.
            </>
          ) : (
            <>No hay tipos de planta en el catálogo todavía.</>
          )}
          {user && tab === 'mine' && (
            <>
              <br />
              <Link to="/catalog/new" className="text-primary-strong underline">
                Crear la primera
              </Link>
            </>
          )}
        </p>
      )}
    </div>
  )
}
