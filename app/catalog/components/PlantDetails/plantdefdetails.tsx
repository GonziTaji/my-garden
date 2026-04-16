import { lightLevel } from "@/domain/plants/light/light-level"
import { PlantDefinition } from "@/domain/plants/plant-definition"
import { soilType } from "@/domain/plants/soil/soil-type"
import { waterProfile } from "@/domain/plants/water/water-profile"

export interface PlantDefinitionDetailsProps {
    definition: PlantDefinition
}

export default function PlantDefinitionDetails({ definition }: PlantDefinitionDetailsProps) {
    return (
        <dl>
            <dt>Tipo de planta</dt>
            <dd>
                <strong>{definition.commonName}</strong>
                <br />
                <em>{definition.scientificName}</em>
            </dd>

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
        </dl>
    )
}
