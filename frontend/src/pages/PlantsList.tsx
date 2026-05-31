import { type SubmitEvent } from "react"
import { usePlants } from "@/api/plants"
import { useBulkWater, useWateringHistoryRange } from "@/api/watering"
import { useSearchParams } from "@/router/provider"
import { buttonVariants } from "@/ui/classVariants/button"
import PlantListComponent, { type PlantsListProps } from "@/ui/components/PlantsList"
import WateringList from "@/ui/components/WateringList"
import WateringHistoryGrid from "@/ui/components/WateringHistoryGrid"
import { toISODateString } from "@/utils/format-date"

type Tab = "list" | "water" | "history"

const TAB_SEARCH: Record<Tab, string> = {
  list: "plants",
  water: "watering",
  history: "history",
}

export default function PlantsList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get("t")
  const tab: Tab = rawTab === "watering" ? "water" : rawTab === "history" ? "history" : "list"

  function handleTabChange(newTab: Tab) {
    setSearchParams({ t: TAB_SEARCH[newTab] })
  }
  const { data: plants, isLoading, error } = usePlants()
  const bulkWater = useBulkWater()
  const dates = getDateRange(3)
  const plantIds = plants?.map((p) => p.id) ?? []
  const { data: wateredMap } = useWateringHistoryRange(plantIds, dates[0], dates[dates.length - 1])

  if (isLoading) return <div className="p-8 text-center text-olive-500">Cargando...</div>
  if (error) return <div className="p-8 text-center text-red-500">Error al cargar las plantas</div>

  const listGroups: PlantsListProps["groups"] = {}
  // const wateringGroups: WateringListProps["groups"] = {}

  if (plants) {
    for (const p of plants) {
      const key = String(p.definition.id)

      if (!listGroups[key]) {
        listGroups[key] = { plants: [p], definition: p.definition }
      } else if (!listGroups[key].plants) {
        listGroups[key].plants = [p]
      } else {
        listGroups[key].plants.push(p)
      }
    }
  }

  function handleBulkWater(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const raw = fd.get("plantIds")?.toString() ?? "[]"
    const plantIds: number[] = JSON.parse(raw)
    if (plantIds.length > 0) {
      bulkWater.mutate(plantIds)
    }
  }

  return (
    <div>
      <div className="flex gap-1 p-2 border-b border-olive-200">
        {(["list", "water", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={`px-4 py-1 rounded-t-sm text-sm font-medium ${tab === t
              ? "bg-rose-100 text-rose-700 border border-rose-200 border-b-white -mb-px"
              : "text-olive-500 hover:text-olive-700"
              }`}
          >
            {t === "list" ? "Mis Plantas" : t === "water" ? "Regar" : "Historial"}
          </button>
        ))}
      </div>

      {tab === "list" && (
        <PlantListComponent groups={listGroups} />
      )}

      {tab === "water" && (
        <form onSubmit={handleBulkWater} className="p-4 flex flex-col gap-4">
          <WateringList groups={listGroups} />
          <button
            type="submit"
            className={buttonVariants({ variant: "primary" })}
            disabled={bulkWater.isPending}
          >
            {bulkWater.isPending ? "Regando..." : "Regar seleccionadas"}
          </button>
        </form>
      )}

      {tab === "history" && plants && (
        <WateringHistoryGrid
          plants={plants.map((p) => ({
            id: p.id,
            nickname: p.nickname,
            plantDefinition: {
              commonName: p.definition.commonName,
            },
          }))}
          dates={dates}
          wateredMap={wateredMap ?? new Map()}
        />
      )}
    </div>
  )
}

/** @param {number} margin the days after and before the current date to be included in the range */
function getDateRange(margin: number): string[] {
  const dates: string[] = []
  const today = new Date()
  for (let i = -margin; i <= margin; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    dates.push(toISODateString(d))
  }
  return dates
}
