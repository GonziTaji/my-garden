"use client"

import { plantCategory } from "@/domain/plants/category/plant-category"
import { lightLevel } from "@/domain/plants/light/light-level"
import { PlantDefinition } from "@/domain/plants/plant-definition"
import { soilType } from "@/domain/plants/soil/soil-type"
import { petToxicity } from "@/domain/plants/toxicity/pet-toxicity"
import { waterProfile } from "@/domain/plants/water/water-profile"
import styles from './styles.module.css'
import DeletePlantDefinitionButton from "../DeletePlantDefinitionButton"
import { useRouter, useSearchParams } from "next/navigation"
import { SubmitEvent, useEffect, useState } from "react"
import { upsertPlantDefinition } from "../../actions"

export interface PlantDefinitionDetailsProps {
    isEdit: boolean
    definition: PlantDefinition
}

export default function PlantDefinitionDetails({ definition, isEdit }: PlantDefinitionDetailsProps) {
    const [isSaving, setIsSaving] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()

    // have to do this because it cannot be done after a successfull action as-is.
    // I'll have to read the docs to see how this can be handled withoud an effect
    useEffect(() => {
        setIsSaving(false)
    }, [searchParams, setIsSaving])

    const changeEditMode = (editMode: boolean) => {
        const url = new URL(location.href)
        url.searchParams.set('e', editMode ? 'T' : 'F')
        router.push(url.toString())
    }

    const handleEdit = () => {
        changeEditMode(true)
    }

    const handleCancel = () => {
        changeEditMode(false)
    }

    const handleSubmit = async (ev: SubmitEvent<HTMLFormElement>) => {
        ev.preventDefault()
        setIsSaving(true)

        const fd = new FormData(ev.currentTarget.closest('form')!)
        const { error } = await upsertPlantDefinition(fd)

        if (error) {
            alert(error)
        }
    }

    return (
        <form className="border p-4" onSubmit={handleSubmit}>
            {isSaving && 'SAVING'}
            <input name="id" type="hidden" defaultValue={definition.id} />

            <div className="w-max p-4 ps-12">
                <input
                    className="text-3xl block border disabled:border-0 border-slate-300 rounded-sm"
                    type="text"
                    name="commonName"
                    defaultValue={definition.commonName}
                    disabled={!isEdit}
                />
                <input
                    className="text-lg italic border disabled:border-0 border-slate-300 rounded-sm"
                    type="text"
                    name="scientificName"
                    defaultValue={definition.scientificName}
                    disabled={!isEdit}
                />
            </div>

            <dl className={styles.detailsList}>
                <dt>Tipo de planta</dt>
                <dd>
                    <ul>
                        {plantCategory.options.map((opt) => (
                            <li key={opt.value}>
                                <label>
                                    <input
                                        name="categories"
                                        type="checkbox"
                                        defaultValue={opt.value}
                                        defaultChecked={definition.categories.includes(opt.value)}
                                        disabled={!isEdit}
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
                                        name="waterProfile"
                                        type="radio"
                                        defaultValue={opt.value}
                                        defaultChecked={definition.waterProfile === opt.value}
                                        disabled={!isEdit}
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
                                        name="lightLevel"
                                        type="radio"
                                        defaultValue={opt.value}
                                        defaultChecked={definition.lightLevel === opt.value}
                                        disabled={!isEdit}
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
                                    <input name="soilType"
                                        type="radio"
                                        defaultValue={opt.value}
                                        defaultChecked={definition.soilType === opt.value}
                                        disabled={!isEdit}
                                    />
                                    <span>{opt.label}</span>
                                </label>
                            </li>
                        ))}
                    </ul>
                </dd>

                <dt>Pet friendly?</dt>
                <dd>
                    {isEdit ? (
                        <ul>{
                            petToxicity.options.map((opt) => (
                                <li key={opt.value}>
                                    <label>
                                        <input name="petToxicity"
                                            type="radio"
                                            defaultValue={opt.value}
                                            defaultChecked={definition.petToxicity === opt.value}
                                        />
                                        <span>{opt.label}</span>
                                    </label>
                                </li>
                            ))
                        }</ul>
                    ) : petToxicity.meta[definition.petToxicity].label}

                    {(definition.symptoms.length > 0 || isEdit) &&
                        <dl>
                            <dt>Síntomas</dt>
                            <dd>
                                <textarea
                                    className="border disabled:border-0 border-slate-300 rounded-sm not-disabled:w-full"
                                    name="symptoms"
                                    disabled={!isEdit}
                                    defaultValue={definition.symptoms}
                                >
                                </textarea>
                            </dd>
                        </dl>
                    }
                </dd>
            </dl>

            {isEdit ? (
                <div className="flex">
                    <button type="submit">Guardar</button>
                    <button type="button" onClick={handleCancel}>Cancelar</button>

                    <div className="grow text-end">
                        <DeletePlantDefinitionButton def={definition} />
                    </div>

                </div>
            ) : (
                <button type="button" onClick={handleEdit}>Editar</button>
            )}
        </form>
    )
}
