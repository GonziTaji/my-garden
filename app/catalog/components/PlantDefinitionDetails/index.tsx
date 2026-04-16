"use client"

import { plantCategory } from "@/domain/plants/category/plant-category"
import { lightLevel } from "@/domain/plants/light/light-level"
import { PlantDefinition } from "@/domain/plants/plant-definition"
import { soilType } from "@/domain/plants/soil/soil-type"
import { petToxicity } from "@/domain/plants/toxicity/pet-toxicity"
import { waterProfile } from "@/domain/plants/water/water-profile"
import styles from './styles.module.css'
import { useRouter } from "next/navigation"
import { ChangeEventHandler, FC, SubmitEvent, useEffect, useState, useTransition } from "react"
import { deletePlantDefinition, upsertPlantDefinition } from "../../actions"
import { cn } from "@sglara/cn"
import { cva } from "class-variance-authority"
import Link from "next/link"

const checkboxLabelVariants = cva([
    "px-1",
    "content-center",
    "block",
    "w-full",
    "min-w-24",
    "min-h-12",
    "has-checked:border-rose-100",
    "not-[:has(:checked)]:border-olive-200"
], {
    variants: {
        disabled: {
            true: "has-checked:border-3",
            false: "cursor-pointer border-3",
        },
    },
})

const buttonVariants = cva(["h-8 min-w-24", "px-3", "py-1", "rounded-md", "cursor-pointer"], {
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
                <label className={checkboxLabelVariants({ disabled })}>
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

interface ImageSelectorProps {
    image?: PlantDefinition['images'][number]
}

const ImageSelector: FC<ImageSelectorProps> = ({ image }) => {
    const [previewUrl, setPreviewUrl] = useState<string>(image?.filepath ?? '')

    useEffect(() => {
        return () => URL.revokeObjectURL(previewUrl)
    }, [])

    const handleRemoveImage = () => {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl('')
    }

    const handleOnChangeImage: ChangeEventHandler<HTMLInputElement> = (ev) => {
        URL.revokeObjectURL(previewUrl)

        const maybeFile = ev.currentTarget.files?.item(0)
        if (maybeFile) {
            setPreviewUrl(URL.createObjectURL(maybeFile))
        } else {
            setPreviewUrl('')
        }
    }

    return (
        <div className="flex flex-col gap-2 p-2 rounded-sm">
            <input
                type="hidden"
                name="imagesExistingId"
                value={image?.id ?? ''}
                readOnly
            />
            <input
                type="hidden"
                name="imagesIsRemoved"
                value={previewUrl ? 'false' : 'true'}
                readOnly
            />

            {/* TODO: ask the user if it wants to select and image or take a picture */}
            <label
                role="button"
                className="relative h-36 cursor-pointer"
            >
                <input
                    name="imagesFile"
                    className="hidden"
                    type="file"
                    accept="image/*"
                    onChange={handleOnChangeImage}
                />

                {previewUrl ? (
                    <>
                        <img className="h-full w-full object-cover" src={previewUrl} alt="" width={150} height={150} />

                        <button
                            className="absolute left-0 bottom-0 text-sm w-full px-2 py-1 bg-slate-900/60 text-white"
                            type="button"
                            onClick={handleRemoveImage}
                        >
                            Quitar
                        </button>
                    </>
                ) : (
                    <div className="h-full w-full border border-dashed border-olive-300 grid place-content-center text-sm text-slate-500">
                        Agregar imagen
                    </div>
                )}
            </label>
        </div>
    )
}

export default function PlantDefinitionDetails({ definition, isEdit }: PlantDefinitionDetailsProps) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

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
        console.log(fd)

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
        <form className="p-4 overflow-auto mb-12" onSubmit={handleSubmit}>
            <input name="id" type="hidden" defaultValue={definition.id || ''} />

            <div className="flex justify-end gap-3 p-4">
                <div className="grow">
                    <Link
                        className={buttonVariants({ variant: 'secondary', className: 'h-full inline-block' })}
                        href="/catalog"
                    >
                        Catalogo
                    </Link>
                </div>

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
                            type="reset"
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

            <div className="border py-8 px-8">
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

                <div>
                    {isEdit ? (
                        <div className="grid gap-2 grid-cols-3">
                            {[0, 1, 2].map((n) =>
                                <ImageSelector image={definition.images[n]} key={n} />
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-2 grid-cols-3">
                            {definition.images.map((image) => (
                                <img
                                    key={image.id}
                                    className="h-32 w-full object-cover border border-olive-300 rounded-sm"
                                    src={image.filepath}
                                    alt="Imagen de planta"
                                />
                            ))}
                        </div>
                    )}
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
                        <dd className="text-start!">
                            <span>{petToxicity.meta[definition.petToxicity].label}.</span>
                            <br />
                            <span className="text-sm italic">{definition.petToxicityNotes}</span>
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
            </div>
        </form>
    )
}
