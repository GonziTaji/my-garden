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
import { FC, SubmitEvent, useEffect, useState } from "react"
import { upsertPlantDefinition } from "../../actions"
import { cn } from "@sglara/cn"

interface DetailOption { value: string, label: string, selected: boolean }

type DetailChecklistKey = keyof Pick<PlantDefinition,
    | 'categories'
    | 'waterProfile'
    | 'lightLevel'
    | 'soilType'
    | 'petToxicity'
>

type DetailChecklistType = 'radio' | 'checkbox'

const DetailCheckList: FC<{
    className?: string
    name: DetailChecklistKey,
    type: DetailChecklistType,
    options: DetailOption[],
    disabled?: boolean
}> = ({ name, type, options, disabled, className }) => (
    <ul className={cn("grid grid-cols-[repeat(auto-fit,minmax(72px,1fr))] gap-4 justify-items-center items-center", className)}>
        {options.map((opt) => (
            <li key={opt.value}>
                <label className={cn(
                    "py-1 px-2 content-center block w-full min-w-24 min-h-12",
                    !disabled && "cursor-pointer",
                    "bg-olive-100 has-checked:bg-rose-100",
                )}>
                    <input
                        className="hidden"
                        name={name}
                        type={type}
                        defaultValue={opt.value}
                        defaultChecked={opt.selected}
                        disabled={disabled}
                    />
                    {opt.label}
                </label>
            </li>
        ))}
    </ul>
)

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

    // @review: this can be generalized. But should it be generalized?
    const categoriesOptions = plantCategory.options.map((opt) => ({
        ...opt, selected: definition.categories.includes(opt.value)
    }))

    const waterProfileOptions = waterProfile.options.map((opt) => ({
        ...opt,
        selected: definition.waterProfile === opt.value
    }))

    const lightLevelOptions = lightLevel.options.map((opt) => ({
        ...opt,
        selected: definition.lightLevel === opt.value
    }))

    const soilTypeOptions = soilType.options.map((opt) => ({
        ...opt,
        selected: definition.soilType === opt.value
    }))

    const petToxicityOptions = petToxicity.options.map((opt) => ({
        ...opt,
        selected: definition.petToxicity === opt.value
    }))

    const disabled = !isEdit || isSaving

    return (
        <form className="border p-4 mx-2 overflow-auto mb-12" onSubmit={handleSubmit}>
            <input name="id" type="hidden" defaultValue={definition.id || ''} />

            <div className="p-4 flex flex-col gap-2">
                <input
                    className="text-3xl block border-b border-s border-slate-300 disabled:border-transparent outline-none p-4"
                    type="text"
                    name="commonName"
                    placeholder="Nombre común"
                    defaultValue={definition.commonName}
                    disabled={disabled}
                />
                <input
                    className="text-lg italic border-b border-s border-slate-300 disabled:border-transparent outline-none p-4"
                    type="text"
                    name="scientificName"
                    placeholder="Nombre scientifico"
                    defaultValue={definition.scientificName}
                    disabled={disabled}
                />
            </div>

            <dl className={styles.detailsList}>
                <dt>Tipo de planta</dt>
                <dd>

                    <DetailCheckList
                        options={categoriesOptions}
                        disabled={disabled}
                        type="checkbox"
                        name="categories"
                    />
                </dd>

                <dt>Ciclo de agua</dt>
                <dd>
                    <DetailCheckList
                        options={waterProfileOptions}
                        disabled={disabled}
                        type="radio"
                        name="waterProfile"
                    />
                </dd>

                <dt>Nivel de luz</dt>
                <dd>
                    <DetailCheckList
                        options={lightLevelOptions}
                        disabled={disabled}
                        type="radio"
                        name="lightLevel"
                    />
                </dd>

                <dt>Tipo de suelo</dt>
                <dd>
                    <DetailCheckList
                        options={soilTypeOptions}
                        disabled={disabled}
                        type="radio"
                        name="soilType"
                    />
                </dd>

                <dt>Pet friendly?</dt>
                <dd className="flex gap-4">
                    <DetailCheckList
                        className="flex-col"
                        options={petToxicityOptions}
                        disabled={disabled}
                        type="radio"
                        name="petToxicity"
                    />

                    <dl className="grow">
                        <dt>Notas</dt>
                        <dd>
                            <textarea
                                className="border disabled:border-0 border-slate-300 rounded-sm not-disabled:w-full"
                                name="symptoms"
                                disabled={disabled}
                                defaultValue={definition.petToxicityNotes || 'Sin notas'}
                            >
                            </textarea>
                        </dd>
                    </dl>
                </dd>
            </dl>

            {isEdit ? (
                <div className="flex">
                    <button className="cursor-pointer" type="submit" disabled={isSaving}>Guardar</button>
                    <button className="cursor-pointer" type="button" onClick={handleCancel}>Cancelar</button>

                    <div className="grow text-end">
                        <DeletePlantDefinitionButton disabled def={definition} />
                    </div>

                </div>
            ) : (
                <button
                    className="h-8 w-24 px-3 py-1 bg-rose-200 rounded-md cursor-pointer"
                    type="button"
                    onClick={handleEdit}
                >
                    Editar
                </button>
            )}
        </form>
    )
}
