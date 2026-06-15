import { usePlants } from "@/api/plants"
import { fullsearchPlants, type PlantWithDefinition } from "@/domain/plants/plant"
import { Link } from "@/router/components/Link"
import { useState, type ChangeEvent } from "react"

type PlantsColumnsData = [PlantWithDefinition[], PlantWithDefinition[]]

export interface PlantsListProps {
}

export default function PlantsList({ }: PlantsListProps) {
  const { data: plants, isLoading, error } = usePlants()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDefinitionId, setSelectedDefinitionId] = useState('')

  const plantsColumns: PlantsColumnsData =
    fullsearchPlants(searchTerm, plants || [])
      .filter((plant) => {
        console.log(selectedDefinitionId)
        if (!selectedDefinitionId) return true

        return String(plant.definition.id) === selectedDefinitionId
      })
      .reduce((cols, plant, i) => {
        cols[i % 2].push(plant)
        return cols
      }, [[], []] as PlantsColumnsData) || [[], []]

  const allDefinitions = (plants || [])
    .flatMap((p) => p.definition)
    .filter((p, i, arr) => arr.indexOf(p) === i)

  if (isLoading) return "Obteniendo plantas..."
  if (error) return "Error obteniendo plantas: " + error.toString()

  function handleSearchChange(ev: ChangeEvent<HTMLInputElement>) {
    setSearchTerm(ev.currentTarget.value)
  }

  function handleDefinitionFilterChange(ev: ChangeEvent<HTMLSelectElement>) {
    setSelectedDefinitionId(ev.currentTarget.value)
  }

  return (
    <div className="bg-cyan-800">
      <div className="grid grid-cols-2 p-2 gap-4">
        <input type="search" onChange={handleSearchChange} placeholder="Buscar" className="border-b text-teal-50" />

        <select onChange={handleDefinitionFilterChange} className="border-b text-teal-50">
          <option value="" className="bg-cyan-900">Todas</option>
          {allDefinitions.map((def) => (
            <option key={def.id} value={def.id!} className="bg-cyan-900">{def.commonName} - {def.scientificName}</option>
          ))}
        </select>
      </div>

      <nav className="p-4 h-full grid grid-cols-2 gap-4 ">
        {plantsColumns?.map((col, i) => (
          <div key={i}>
            {col.map((p) => <Link
              key={p.id}
              to="/plants/:plantid"
              params={{ plantid: String(p.id) }}
              className="flex flex-col justify-end rounded bg-rose-200 p-px"
            >
              <div className="w-full overflow-hidden">
                <img src={p.images[0]?.filepath} />
              </div>

              <div className="p-2 flex flex-wrap gap-2 items-baseline">
                <span className="">{p.nickname}</span>
                <span className="text-xs">{p.definition.scientificName}</span>
              </div>

            </Link>
            )}
          </div>
        ))}
      </nav >
    </div>
  )
}
