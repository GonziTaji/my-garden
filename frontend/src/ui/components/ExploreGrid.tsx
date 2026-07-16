import type { PlantSpecies } from '@/domain/plants/plant-species'
import { Link } from '@tanstack/react-router'

export interface ExploreGridProps {
  list: PlantSpecies[]
}

export default function ExploreGrid({ list }: ExploreGridProps) {
  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
      {list.map((sp) => (
        <Link
          key={sp.id}
          to="/catalog/$plantspeciesid"
          params={{ plantspeciesid: String(sp.id!) }}
          className="break-inside-avoid mb-4 block"
        >
          <div className="border border-secondary-default rounded-sm overflow-hidden">
            {sp.images[0] ? (
              <img
                src={sp.images[0].filepath}
                className="w-full object-cover"
                alt={`Imagen de ${sp.commonName}`}
              />
            ) : (
              <div className="aspect-square text-center content-center border border-dashed border-secondary-default text-sm text-neutral-strong">
                Sin imagen
              </div>
            )}
            <div className="p-3">
              <p className="font-semibold text-lg leading-tight">
                {sp.commonName}
              </p>
              <p className="text-sm text-neutral-strong">{sp.authorUsername}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
