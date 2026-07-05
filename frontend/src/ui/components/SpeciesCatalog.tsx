import { plantCategory } from '@/domain/plants/category/plant-category'
import { lightLevel } from '@/domain/plants/light/light-level'
import type { PlantSpecies } from '@/domain/plants/plant-species'
import { soilType } from '@/domain/plants/soil/soil-type'
import { waterProfile } from '@/domain/plants/water/water-profile'
import { cn } from '@sglara/cn'
import { Link } from '@/router/components/Link'

export interface SpeciesCatalogProps {
  list: PlantSpecies[]
}

export default function SpeciesCatalog({ list }: SpeciesCatalogProps) {
  return (
    <nav className="grid grid-cols-2 bg-secondary-light">
      {list.map((sp) => (
        <Link
          key={sp.id}
          to="/catalog/:plantspeciesid"
          params={{ plantspeciesid: String(sp.id) }}
        >
          <div className="p-12 pb-0">
            {sp.images[0] ? (
              <img
                src={sp.images[0].filepath}
                className="aspect-square object-cover"
                alt={`Imagen de ${sp.commonName}`}
                width={150}
                height={150}
              />
            ) : (
              <div className="aspect-square text-center content-center border border-dashed border-secondary-default text-sm text-neutral-strong">
                Sin imagen
              </div>
            )}
          </div>

          <div className="flex flex-col items-center text-center">
            <span className="font-semibold text-xl">{sp.commonName}</span>
            <span className="italic text-xl">{sp.scientificName}</span>

            <div className="text-sm">
              {sp.categories?.map((c) => (
                <span key={c.toString()}>{plantCategory.meta[c].label}</span>
              ))}
            </div>

            <div>
              {waterProfile.values.map((w, i) => (
                <span
                  key={w}
                  className={cn(
                    waterProfile.values.indexOf(sp.waterProfile) < i &&
                      'grayscale'
                  )}
                >
                  💧
                </span>
              ))}
            </div>

            <div>
              {lightLevel.values.map((l, i) => (
                <span
                  key={l}
                  className={cn(
                    lightLevel.values.indexOf(sp.lightLevel) < i && 'grayscale'
                  )}
                >
                  ☀️
                </span>
              ))}
            </div>

            <div>
              {soilType.values.toReversed().map((s, i) => (
                <span
                  key={s}
                  className={cn(
                    soilType.values.indexOf(sp.soilType) < i && 'grayscale'
                  )}
                >
                  🤿
                </span>
              ))}
            </div>

            {sp.userPlantCount !== undefined && sp.userPlantCount > 0 && (
              <span className="text-xs text-secondary-strong mt-1">
                {sp.userPlantCount}{' '}
                {sp.userPlantCount === 1 ? 'planta' : 'plantas'}
              </span>
            )}
            {sp.isQuick && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-1 rounded mt-1">
                Rápida
              </span>
            )}
          </div>
        </Link>
      ))}
    </nav>
  )
}
