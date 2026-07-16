import type { PlantSpecies } from '@/domain/plants/plant-species'
import { Link } from '@tanstack/react-router'

export interface ExploreGridProps {
  list: PlantSpecies[]
}

export default function ExploreGrid({ list }: ExploreGridProps) {
  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-4 p-4">
      {list.map((sp) => (
        <Link
          key={sp.id}
          to="/catalog/$plantspeciesid"
          params={{ plantspeciesid: String(sp.id!) }}
          className="break-inside-avoid mb-4 block group"
        >
          <div className="bg-surface-raised rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-neutral-subtle/30">
            {sp.images[0] ? (
              <img
                src={sp.images[0].filepath}
                className="w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                alt={`Imagen de ${sp.commonName}`}
              />
            ) : (
              <div className="aspect-square text-center content-center bg-primary-light text-sm text-neutral-default rounded-t-xl">
                Sin imagen
              </div>
            )}
            <div className="p-3">
              <p className="font-semibold text-lg leading-tight text-neutral-dark">
                {sp.commonName}
              </p>
              <p className="text-sm text-neutral-strong mt-0.5">{sp.authorUsername}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
