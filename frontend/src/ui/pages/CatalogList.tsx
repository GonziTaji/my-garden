import { useMemo } from 'react'
import { useDefinitions } from "@/api/definitions"
import DefinitionsCatalog from "@/ui/components/DefinitionsCatalog"
import { Link } from "@/router/components/Link"
import { buttonVariants } from "@/ui/classVariants/button"
import { useAuth } from "@/auth/AuthContext"
import { useSearchParams } from "@/router/provider"
import { cn } from "@sglara/cn"

type Tab = "mine" | "favorites" | "all"

export default function CatalogList() {
  const { data: definitions, isLoading, error } = useDefinitions()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get("t") as Tab) || "all"

  const filteredDefinitions = useMemo(() => {
    if (!definitions) return []
    switch (tab) {
      case "mine": return definitions.filter(d => d.userId === user?.id)
      case "favorites": return definitions.filter(d => d.isFavorited)
      case "all": default: return definitions
    }
  }, [definitions, tab, user?.id])

  const tabs: { key: Tab; label: string }[] = user
    ? [{ key: "mine", label: "Mías" }, { key: "favorites", label: "Favoritas" }, { key: "all", label: "Todas" }]
    : [{ key: "all", label: "Todas" }]

  if (isLoading) return <div className="p-8 text-center text-olive-500">Cargando...</div>
  if (error) return <div className="p-8 text-center text-red-500">Error al cargar el catálogo</div>

  return (
    <div>
      <div className="flex justify-between items-center p-4">
        <h2 className="text-2xl font-bold text-olive-700">Catálogo de plantas</h2>
        {user && (
          <Link to="/catalog/new" className={buttonVariants({ variant: "primary" })}>
            Nueva
          </Link>
        )}
      </div>

      <div className="flex gap-1 p-2">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setSearchParams({ t: t.key === "all" ? "" : t.key })}
            className={cn("px-4 py-1 rounded-sm text-sm", tab === t.key ? "bg-rose-100 text-rose-700 border border-rose-200" : "hover:text-olive-700")}>
            {t.label}
          </button>
        ))}
      </div>

      {filteredDefinitions.length > 0 ? (
        <DefinitionsCatalog list={filteredDefinitions} />
      ) : (
        <p className="text-center text-olive-500 py-12">
          No hay tipos de planta en el catálogo todavía.
          {user && tab === "all" && (
            <>
              <br />
              <Link to="/catalog/new" className="text-rose-500 underline">
                Crear la primera
              </Link>
            </>
          )}
        </p>
      )}
    </div>
  )
}
