"use client"

import { plantCategory } from "@/domain/plants/category/plant-category"
import { lightLevel } from "@/domain/plants/light/light-level"
import { PlantDefinition } from "@/domain/plants/plant-definition"
import { soilType } from "@/domain/plants/soil/soil-type"
import { petToxicity } from "@/domain/plants/toxicity/pet-toxicity"
import { waterProfile } from "@/domain/plants/water/water-profile"
import styles from './styles.module.css'
import { useRouter } from "next/navigation"
import { FC, SubmitEvent, useTransition } from "react"
import { deletePlantDefinition, upsertPlantDefinition } from "../../actions"
import { cn } from "@sglara/cn"
import { cva } from "class-variance-authority"

const buttonVariants = cva(["h-8 w-24", "px-3", "py-1", "rounded-md", "cursor-pointer"], {
    variants: {
        variant: {
            primary: 'bg-rose-200',
            secondary: 'bg-olive-300',
            danger: 'bg-red-400 text-white',
        }
    }
})

const namesInputVariants = cva(["transition-all", "border", "outline-rose-400", "p-1"], {
    variants: {
        value: {
            commonName: ["text-3xl", "rounded-t-sm", "border-b-0"],
            scientificName: ["italic", "text-lg", "rounded-b-sm", "border-t-0"],
        },
        disabled: {
            true: ["border-transparent"],
            false: ["border-rose-200", "ps-3"],
        }
    }
})

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
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    // const searchParams = useSearchParams()

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
        const fd = new FormData(ev.currentTarget.closest('form')!)

        startTransition(async () => {
            const { error } = await upsertPlantDefinition(fd)

            if (error) {
                alert(error)
            }
        })
    }

    const handleDelete = (id: number, name: string) => {
        const confirmed = confirm(
            `Esto eliminara el tipo "${name}" y todas sus plantas asociadas. ¿Continuar?`
        )

        if (!confirmed) return

        startTransition(async () => {
            const result = await deletePlantDefinition(id)
            if (!result.success) {
                alert(result.error ?? 'Error al eliminar')
            }
        })
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

    const disabled = !isEdit || isPending

    return (
        <form className="border p-4 mx-2 overflow-auto mb-12" onSubmit={handleSubmit}>
            <input name="id" type="hidden" defaultValue={definition.id || ''} />

            <div className="flex flex-col gap-2">
                <div className="flex justify-end gap-3">
                    {isEdit ? (
                        <>
                            <button
                                className={buttonVariants({ variant: 'primary' })}
                                type="submit"
                                disabled={isPending}
                            >
                                {isPending ? 'Guardando' : 'Guardar'}
                            </button>
                            <button
                                className={buttonVariants({ variant: 'secondary' })}
                                type="button"
                                onClick={handleCancel}
                            >
                                Cancelar
                            </button>
                        </>
                    ) : (
                        <button
                            className={buttonVariants({ variant: 'primary' })}
                            type="button"
                            onClick={handleEdit}
                        >
                            Editar
                        </button>
                    )}
                </div>

                <div className="flex flex-col min-w-0">
                    <input
                        className={namesInputVariants({ value: 'commonName', disabled })}
                        type="text"
                        name="commonName"
                        placeholder="Nombre común"
                        defaultValue={definition.commonName}
                        disabled={disabled}
                    />
                    <input
                        className={namesInputVariants({ value: 'scientificName', disabled })}
                        type="text"
                        name="scientificName"
                        placeholder="Nombre scientifico"
                        defaultValue={definition.scientificName}
                        disabled={disabled}
                    />
                </div>
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
                {isEdit ? (
                    <dd className="flex gap-4">
                        <DetailCheckList
                            className="flex-col"
                            options={petToxicityOptions}
                            disabled={disabled}
                            type="radio"
                            name="petToxicity"
                        />

                        <label className="grow text-start flex flex-col">
                            <span className="block p-1">Notas:</span>
                            <textarea
                                className="border disabled:border-0 border-slate-300 rounded-sm not-disabled:w-full p-2 grow"
                                name="symptoms"
                                disabled={disabled}
                                defaultValue={definition.petToxicityNotes}
                                placeholder="Una nota sobre algo..."
                            >
                            </textarea>
                        </label>
                    </dd>
                ) : (
                    <dd>
                        {petToxicity.meta[definition.petToxicity].label}.{' '}{definition.petToxicityNotes}
                    </dd>
                )}



                {isEdit && definition.id && (
                    <>
                        <dt className="text-red-400 font-bold">DANGER ZONE</dt>
                        <dd className="flex gap-4">
                            <div>
                                <button
                                    type="button"
                                    className={cn(buttonVariants({ variant: 'danger' }))}
                                    onClick={() => handleDelete(definition.id!, definition.commonName)}
                                    disabled={isPending}
                                >
                                    {isPending ? 'Eliminando...' : 'Eliminar'}
                                </button>
                            </div>
                        </dd>
                    </>
                )}

            </dl>
        </form>
    )
}

