import { plantCategory } from "@/domain/plants/category/plant-category"
import { lightLevel } from "@/domain/plants/light/light-level"
import { PlantDefinition } from "@/domain/plants/plant-definition"
import { soilType } from "@/domain/plants/soil/soil-type"
import { petToxicity } from "@/domain/plants/toxicity/pet-toxicity"
import { waterProfile } from "@/domain/plants/water/water-profile"
import styles from './styles.module.css'

export interface PlantDefinitionDetailsProps {
    definition: PlantDefinition
}

export default function PlantDefinitionDetails({ definition }: PlantDefinitionDetailsProps) {
    return (
        <div className={styles.container}>
            <h1 className="text-3xl text-center">{definition.commonName}</h1>

            <dl>
                <dt>Nombre scientifico</dt>
                <dd>
                    <em>{definition.scientificName}</em>
                </dd>

                <dt>Tipo de planta</dt>
                <dd>
                    <ul>
                        {plantCategory.options.map((opt) => (
                            <li key={opt.value}>
                                <label>
                                    <input
                                        name="plant-category"
                                        type="checkbox"
                                        value={opt.value}
                                        checked={definition.categories.includes(opt.value)}
                                        disabled
                                    />
                                    <span>{opt.label}</span>
                                </label>
                            </li>
                        ))}
                    </ul>
                </dd>

                <dt>Perfil de agua</dt>
                <dd>
                    <ul>
                        {waterProfile.options.map((opt) => (
                            <li key={opt.value}>
                                <label>
                                    <input
                                        name="plant-waterprofile"
                                        type="radio"
                                        value={opt.value}
                                        checked={definition.waterProfile === opt.value}
                                        disabled
                                    />
                                    <span>{opt.label}</span>
                                </label>
                            </li>
                        ))}
                    </ul>
                </dd>

                <dt>Nivel de luz</dt>
                <dd>
                    <ul>
                        {lightLevel.options.map((opt) => (
                            <li key={opt.value}>
                                <label>
                                    <input
                                        name="plant-lightlevel"
                                        type="radio"
                                        value={opt.value}
                                        checked={definition.lightLevel === opt.value}
                                        disabled
                                    />
                                    <span>{opt.label}</span>
                                </label>
                            </li>
                        ))}
                    </ul>
                </dd>

                <dt>Tipo de suelo</dt>
                <dd>
                    <ul>
                        {soilType.options.map((opt) => (
                            <li key={opt.value}>
                                <label>
                                    <input name="plant-soiltype"
                                        type="radio"
                                        value={opt.value}
                                        checked={definition.soilType === opt.value}
                                        disabled
                                    />
                                    <span>{opt.label}</span>
                                </label>
                            </li>
                        ))}
                    </ul>
                </dd>

                <dt>Pet friendly?</dt>
                <dd>
                    {petToxicity.meta[definition.petToxicity].label}

                    {definition.symptoms.length > 0 &&
                        <dl>
                            <dt>Síntomas</dt>
                            <dd>
                                <ul>
                                    {definition.symptoms.map((s) => <li key={s}>{s}</li>)}
                                </ul>
                            </dd>
                        </dl>
                    }
                </dd>

            </dl>
        </div>
    )
}
