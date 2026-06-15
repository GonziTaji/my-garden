import type { ReactNode } from "react"
import { Link } from "@/router/components/Link"

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="h-full w-full grid grid-rows-[auto_1fr]">
      <nav className="p-2 flex gap-2 text-lg bg-olive-50 border-b border-olive-200">
        <Link to="/" className="font-bold text-olive-700 hover:text-olive-500">
          Mi jardín
        </Link>
        <span className="text-olive-300">|</span>
        <Link to="/plants" className="text-olive-600 hover:text-olive-400">
          Plantas
        </Link>
        <Link to="/catalog" className="text-olive-600 hover:text-olive-400">
          Catálogo
        </Link>
      </nav>

      <main className="overflow-auto lg:max-w-xl">{children}</main>
    </div>
  )
}
