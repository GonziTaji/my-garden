import type { PlantWithDefinition } from "@/domain/plants/plant"

interface PlantDetailProps {
  plant: PlantWithDefinition
}

export default function PlantDetails({ plant }: PlantDetailProps) {
  return (
    <section className="plant-detail">
      <h1>{plant.nickname}</h1>

      <dl>

        {plant.location && (
          <>
            <dt>Ubicacion</dt>
            <dd>{plant.location}</dd>
          </>
        )}

        {plant.acquiredAt && (
          <>
            <dt>Fecha de adquisicion</dt>
            <dd>{plant.acquiredAt.toLocaleDateString()}</dd>
          </>
        )}

        {plant.notes && (
          <>
            <dt>Notas</dt>
            <dd>{plant.notes}</dd>
          </>
        )}
      </dl>
    </section>
  )
}
