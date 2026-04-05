import { WaterProfile, waterProfile } from '@/domain/plants/water/water-profile'
import { lightLevel } from '@/domain/plants/light/light-level'
import { soilType } from '@/domain/plants/soil/soil-type'
import { PlantWithDefinition } from '@/db/stores/plants.store'
import { PlantDefinition } from '@/domain/plants/plant-definition'

interface PlantDetailProps {
    plant: PlantWithDefinition
    definition: PlantDefinition
    waterProfileOverride?: WaterProfile
}

export default function PlantDetail({ plant, definition }: PlantDetailProps) {
    return (
        <section className="plant-detail">
            <h1>{plant.nickname}</h1>

            <dl>
                <dt>Tipo de planta</dt>
                <dd>
                    <strong>{plant.plantDefinition.commonName}</strong>
                    <br />
                    <em>{plant.plantDefinition.scientificName}</em>
                </dd>

                <>
                    <dt>Perfil de agua</dt>
                    <dd>
                        {waterProfile.meta[definition.waterProfile]?.label}
                    </dd>

                    <dt>Nivel de luz</dt>
                    <dd>
                        {lightLevel.meta[definition.lightLevel]?.label ?? definition.lightLevel}
                    </dd>

                    <dt>Tipo de suelo</dt>
                    <dd>
                        {soilType.meta[definition.soilType]?.label ?? definition.soilType}
                    </dd>
                </>

                {plant.location && (
                    <>
                        <dt>Ubicacion</dt>
                        <dd>{plant.location}</dd>
                    </>
                )}

                {plant.acquiredAt && (
                    <>
                        <dt>Fecha de adquisicion</dt>
                        <dd>{plant.acquiredAt}</dd>
                    </>
                )}

                {plant.notes && (
                    <>
                        <dt>Notas</dt>
                        <dd>{plant.notes}</dd>
                    </>
                )}
            </dl>

            <nav>
                <a href="/plants">Volver al listado</a>
            </nav>
        </section>
    )
}
