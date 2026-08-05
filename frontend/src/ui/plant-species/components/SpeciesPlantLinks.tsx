import { usePlants } from '@/ui/plants/queries/plants'
import { Link } from '@tanstack/react-router'

interface SpeciesPlantLinksProps {
  recordId: number
  isDeleted: boolean
}

export function SpeciesPlantLinks({ recordId, isDeleted }: SpeciesPlantLinksProps) {
  const { data: linkedPlants } = usePlants(recordId)

  return (
    <div>
      <hr className="my-6 border-neutral-subtle/40" />
      <h3 className="font-semibold text-neutral-dark mb-3">Mis plantas de esta especie</h3>
      <div className="flex flex-col gap-1 mb-4">
        {linkedPlants?.map((plant) => (
          <Link
            key={plant.id}
            to="/plants/$plantid"
            params={{ plantid: String(plant.id) }}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-primary-subtle/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-primary-light shrink-0">
              {plant.images[0]?.filepath ? (
                <img
                  src={plant.images[0].filepath}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-neutral-default">
                  ?
                </div>
              )}
            </div>
            <span className="text-neutral-dark">{plant.nickname}</span>
          </Link>
        ))}
      </div>

      <p className="text-neutral-strong mb-4">
        {!linkedPlants?.length && <span>Sin plantas.</span>}

        {!isDeleted && (
          <Link
            to="/plants/new"
            search={{ plantSpeciesId: recordId }}
            className="text-primary-dark hover:text-primary-strong hover:underline transition-colors ml-1"
          >
            Nueva
          </Link>
        )}
      </p>
      <hr className="my-6 border-neutral-subtle/40" />
    </div>
  )
}
