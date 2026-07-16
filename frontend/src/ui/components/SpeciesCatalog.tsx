import { plantCategory } from '@/domain/plants/category/plant-category'
import { lightLevel } from '@/domain/plants/light/light-level'
import type { PlantSpecies } from '@/domain/plants/plant-species'
import { soilType } from '@/domain/plants/soil/soil-type'
import { waterProfile } from '@/domain/plants/water/water-profile'
import { cn } from '@sglara/cn'
import { Link } from '@tanstack/react-router'

export interface SpeciesCatalogProps {
  list: PlantSpecies[]
}

export default function SpeciesCatalog({ list }: SpeciesCatalogProps) {
  return (
    <nav className="grid grid-cols-2 gap-3 p-4">
      {list.map((sp) => (
        <Link
          key={sp.id}
          to="/catalog/$plantspeciesid"
          params={{ plantspeciesid: String(sp.id!) }}
          className="group"
        >
          <div className="bg-surface-raised rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-neutral-subtle/30">
            <div className="p-8 pb-0">
              {sp.images[0] ? (
                <img
                  src={sp.images[0].filepath}
                  className="aspect-square object-cover rounded-lg group-hover:scale-[1.02] transition-transform duration-300"
                  alt={`Imagen de ${sp.commonName}`}
                  width={150}
                  height={150}
                />
              ) : (
                <div className="aspect-square text-center content-center border border-dashed border-neutral-subtle rounded-lg text-sm text-neutral-default bg-primary-light/50">
                  Sin imagen
                </div>
              )}
            </div>

            <div className="flex flex-col items-center text-center p-3">
              <span className="font-semibold text-lg text-neutral-dark">{sp.commonName}</span>
              <span className="italic text-sm text-neutral-strong">{sp.scientificName}</span>

              <div className="text-xs text-neutral-strong mt-1">
                {sp.categories?.map((c) => (
                  <span key={c.toString()}>{plantCategory.meta[c].label}</span>
                ))}
              </div>

              <div className="flex gap-0.5 mt-1">
                {waterProfile.values.map((w, i) => (
                  <span
                    key={w}
                    className={cn(
                      'text-sm',
                      waterProfile.values.indexOf(sp.waterProfile) < i && 'grayscale opacity-40'
                    )}
                  >
                    💧
                  </span>
                ))}
              </div>

              <div className="flex gap-0.5">
                {lightLevel.values.map((l, i) => (
                  <span
                    key={l}
                    className={cn(
                      'text-sm',
                      lightLevel.values.indexOf(sp.lightLevel) < i && 'grayscale opacity-40'
                    )}
                  >
                    ☀️
                  </span>
                ))}
              </div>

              <div className="flex gap-0.5">
                {soilType.values.toReversed().map((s, i) => (
                  <span
                    key={s}
                    className={cn(
                      'text-sm',
                      soilType.values.indexOf(sp.soilType) < i && 'grayscale opacity-40'
                    )}
                  >
                    🤿
                  </span>
                ))}
              </div>

              {sp.userPlantCount !== undefined && sp.userPlantCount > 0 && (
                <span className="text-xs text-neutral-strong mt-1">
                  {sp.userPlantCount} {sp.userPlantCount === 1 ? 'planta' : 'plantas'}
                </span>
              )}
              {sp.isQuick && (
                <span className="text-xs bg-primary-subtle text-primary-dark px-2 py-0.5 rounded-full mt-1 font-medium">
                  Rápida
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </nav>
  )
}
