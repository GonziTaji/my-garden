import type { ReactNode } from "react"
import { Link } from "@/router/components/Link"
import { useAuth } from "@/auth/AuthContext"
import { buttonVariants } from "@/ui/classVariants/button"

export default function Layout({ children }: { children: ReactNode }) {
  const { user, isLoading, logout } = useAuth()

  return (
    <div className="h-full w-full grid grid-rows-[auto_1fr]">
      <nav className="p-2 flex flex-wrap gap-2 text-lg bg-olive-50 border-b border-olive-200 items-center">
        <Link to="/" className="text-olive-600 hover:text-olive-400" activeClassname="font-bold">
          Explorar
        </Link>

        {user && (
          <>
            <span className="text-olive-300">|</span>
            <Link to="/plants" className="text-olive-700 hover:text-olive-500" activeClassname="font-bold">
              Mi jardín
            </Link>
          </>
        )}

        <span className="text-olive-300">|</span>

        <Link to="/catalog" className="text-olive-600 hover:text-olive-400" activeClassname="font-bold">
          Mi Catálogo
        </Link>

        <span className="flex-1" />

        {!isLoading && !user && (
          <Link to="/login" className={buttonVariants({ variant: "clean", size: "sm" })}>
            Iniciar sesión
          </Link>
        )}

        {!isLoading && user && (
          <div className="flex gap-2 items-center text-sm text-olive-600">
            <span>{user.username}</span>
            <button onClick={logout} className={buttonVariants({ variant: "tertiary", size: "sm" })}>
              Cerrar sesión
            </button>
          </div>
        )}
      </nav>

      <main className="overflow-auto lg:max-w-xl">{children}</main>
    </div>
  )
}
