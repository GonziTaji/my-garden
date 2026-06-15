import { useSearchParams } from "@/router/provider"
import PlantListComponent from "@/ui/components/PlantsList"
import WateringList from "@/ui/components/WateringList"
import WateringHistoryGrid from "@/ui/components/WateringHistoryGrid"
import { cn } from "@sglara/cn"

type Tab = "list" | "water" | "history"

export default function PlantsList() {
  const [searchParams, setSearchParams] = useSearchParams()

  const tab = searchParams.get("t") || 'list'

  function handleTabChange(newTab: Tab) {
    setSearchParams({ t: newTab })
  }

  return (
    <div className="h-full w-full flex flex-col bg-cyan-800">
      <div className="grow">
        {tab === "water" && <WateringList />}
        {tab === "history" && <WateringHistoryGrid />}
        {tab === "list" && <PlantListComponent />}
      </div>

      <div className="flex gap-1 p-2">
        {(["list", "water", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={cn("px-4 py-1 rounded-sm text-sm",
              tab === t
                ? "bg-rose-100 text-rose-700 border border-rose-200 border-b-white"
                : "text-white hover:text-olive-700"
            )}
          >
            {t === "list" && "Mi Jardín"}
            {t === "water" && "Regar"}
            {t === "history" && "Historial"}
          </button>
        ))}
      </div>

    </div>
  )
}
