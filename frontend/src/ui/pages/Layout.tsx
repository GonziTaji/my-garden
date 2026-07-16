import { Link, Outlet } from '@tanstack/react-router'
import { useAuth } from '@/auth/AuthContext'
import { buttonVariants } from '@/ui/classVariants/button'

export default function Layout() {
  const { user, isLoading, logout } = useAuth()

  return (
    <div className="h-full w-full grid grid-rows-[auto_1fr]">
      <nav className="p-2 flex flex-wrap gap-2 text-lg bg-secondary-light border-b border-secondary-subtle items-center">
        <Link
          to="/"
          activeOptions={{ exact: true }}
          activeProps={{ className: 'font-bold' }}
          className="text-secondary-dark hover:text-secondary-strong"
        >
          Explorar
        </Link>

        {user && (
          <>
            <span className="text-secondary-default">|</span>
            <Link
              to="/plants"
              activeProps={{ className: 'font-bold' }}
              className="text-secondary-dark hover:text-secondary-strong"
            >
              Mi jardin
            </Link>
          </>
        )}

        <span className="text-secondary-default">|</span>

        <Link
          to="/catalog"
          activeProps={{ className: 'font-bold' }}
          className="text-secondary-dark hover:text-secondary-strong"
        >
          Mi Catalogo
        </Link>

        <span className="flex-1" />

        {!isLoading && !user && (
          <Link
            to="/login"
            activeProps={{ className: 'font-bold' }}
            className={buttonVariants({ variant: 'clean', size: 'sm' })}
          >
            Iniciar sesion
          </Link>
        )}

        {!isLoading && user && (
          <div className="flex gap-2 items-center text-sm text-secondary-dark">
            <span>{user.username}</span>
            <button
              type="button"
              onClick={logout}
              className={buttonVariants({ variant: 'tertiary', size: 'sm' })}
            >
              Cerrar sesion
            </button>
          </div>
        )}
      </nav>

      <main className="overflow-auto lg:max-w-xl">
        <Outlet />
      </main>
    </div>
  )
}
