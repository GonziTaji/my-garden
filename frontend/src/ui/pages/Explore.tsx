import { useExploreDefinitions } from "@/api/definitions"
import ExploreGrid from "@/ui/components/ExploreGrid"

export default function Home() {
  const { data, isLoading, error } = useExploreDefinitions()

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="text-slate-500">Cargando...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="text-red-500">Error al cargar</p>
      </div>
    )
  }

  const definitions = data ?? []

  if (definitions.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="text-slate-500">No hay tipos de planta públicos todavía.</p>
      </div>
    )
  }

  return (
    <div className="mx-2">
      <ExploreGrid list={definitions} />
    </div>
  )
}
