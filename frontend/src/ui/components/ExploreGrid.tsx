import type { PlantDefinition } from '@/domain/plants/plant-definition'
import { Link } from '@/router/components/Link'

export interface ExploreGridProps {
  list: PlantDefinition[]
}

export default function ExploreGrid({ list }: ExploreGridProps) {
  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
      {list.map((d) => (
        <Link
          key={d.id}
          to="/catalog/:plantdefid"
          params={{ plantdefid: String(d.id) }}
          className="break-inside-avoid mb-4 block"
        >
          <div className="border border-secondary-default rounded-sm overflow-hidden">
            {d.images[0] ? (
              <img
                src={d.images[0].filepath}
                className="w-full object-cover"
                alt={`Imagen de ${d.commonName}`}
              />
            ) : (
              <div className="aspect-square text-center content-center border border-dashed border-secondary-default text-sm text-neutral-strong">
                Sin imagen
              </div>
            )}
            <div className="p-3">
              <p className="font-semibold text-lg leading-tight">
                {d.commonName}
              </p>
              <p className="text-sm text-neutral-strong">{d.authorUsername}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
