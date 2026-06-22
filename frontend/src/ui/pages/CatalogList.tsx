import { useDefinitions } from "@/api/definitions"
import DefinitionsCatalog from "@/ui/components/DefinitionsCatalog"
import { Link } from "@/router/components/Link"
import { buttonVariants } from "@/ui/classVariants/button"
import { useAuth } from "@/auth/AuthContext"

export default function CatalogList() {
  const { data: definitions, isLoading, error } = useDefinitions()
  const { user } = useAuth()

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
      {definitions && definitions.length > 0 ? (
        <DefinitionsCatalog list={definitions} />
      ) : (
        <p className="text-center text-olive-500 py-12">
          No hay tipos de planta en el catálogo todavía.
          {user && (
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
