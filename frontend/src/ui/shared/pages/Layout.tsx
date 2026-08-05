import { Link, Outlet } from '@tanstack/react-router'
import { useAuth } from '@/auth/AuthContext'
import { buttonVariants } from '@/ui/class-variants/button'

export default function Layout() {
  const { user, isLoading, logout } = useAuth()

  return (
    <div className="h-full w-full grid grid-rows-[auto_1fr]">
      <nav className="px-4 py-3 flex flex-wrap gap-3 items-center bg-surface-raised border-b border-neutral-subtle/40 shadow-sm">
        <Link
          to="/"
          activeOptions={{ exact: true }}
          activeProps={{ className: 'font-bold text-primary-dark' }}
          className="text-neutral-dark hover:text-primary-dark transition-colors duration-200"
        >
          Explorar
        </Link>

        {user && (
          <>
            <span className="text-neutral-subtle">·</span>
            <Link
              to="/plants"
              activeProps={{ className: 'font-bold text-primary-dark' }}
              className="text-neutral-dark hover:text-primary-dark transition-colors duration-200"
            >
              Mi jardín
            </Link>
          </>
        )}

        <span className="text-neutral-subtle">·</span>

        <Link
          to="/catalog"
          activeProps={{ className: 'font-bold text-primary-dark' }}
          className="text-neutral-dark hover:text-primary-dark transition-colors duration-200"
        >
          Catálogo
        </Link>

        <span className="flex-1" />

        {!isLoading && !user && (
          <Link
            to="/login"
            activeProps={{ className: 'font-bold' }}
            className={buttonVariants({ variant: 'primary', size: 'sm' })}
          >
            Iniciar sesión
          </Link>
        )}

        {!isLoading && user && (
          <div className="flex gap-3 items-center text-sm">
            <span className="text-neutral-strong">{user.username}</span>
            <button
              type="button"
              onClick={logout}
              className={buttonVariants({ variant: 'clean', size: 'sm' })}
            >
              Salir
            </button>
          </div>
        )}
      </nav>

      <main className="overflow-auto lg:max-w-xl lg:mx-auto lg:w-full">
        <Outlet />
      </main>
    </div>
  )
}
