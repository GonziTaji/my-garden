import type { PlantWithDefinition } from "@/domain/plants/plant"
import { Link } from "@tanstack/react-router"

interface GroupData {
  plants: PlantWithDefinition[]
  definition: PlantWithDefinition['plantDefinition']
}


export interface PlantsListProps {
  groups: Record<string, GroupData>
}

export default function PlantsList({ groups }: PlantsListProps) {
  return (
    <nav className="p-4 h-full">
      <ul className="grid gap-12 border-2 rounded-md border-amber-200/20 bg-amber-100/20">
        {Object.values(groups).map(({ definition, plants }) => (
          <li key={definition.id} className="grid gap-4 px-8 py-4">
            <div className="grid items-center border-olive-600/20 border-b pb-2">
              <span className="text-xl inline-block">{definition.commonName}</span>
              <span className="text-sm italic inline-block">{definition.scientificName}</span>
            </div>

            <ul>
              {plants.map((p) => (
                <li key={p.id}>
                  <Link
                    to="/plants/$plantid"
                    params={{ plantid: String(p.id) }}
                    className="py-2 flex items-center">
                    {'>'} <span className="ps-4 text-2xl">{p.nickname}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul >
    </nav >
  )
}
