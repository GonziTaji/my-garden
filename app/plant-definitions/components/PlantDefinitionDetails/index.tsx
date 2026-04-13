"use client"

import { plantCategory } from "@/domain/plants/category/plant-category"
import { lightLevel } from "@/domain/plants/light/light-level"
import { PlantDefinition } from "@/domain/plants/plant-definition"
import { soilType } from "@/domain/plants/soil/soil-type"
import { petToxicity } from "@/domain/plants/toxicity/pet-toxicity"
import { waterProfile } from "@/domain/plants/water/water-profile"
import styles from './styles.module.css'
import { useRouter } from "next/navigation"
import { FC, SubmitEvent, useEffect, useRef, useState, useTransition } from "react"
import { deletePlantDefinition, upsertPlantDefinition } from "../../actions"
import { cn } from "@sglara/cn"
import { cva } from "class-variance-authority"

const checkboxLabelVariants = cva("px-1 content-center block w-full min-w-24 min-h-12", {
    variants: {
        disabled: {
            true: "",
            false: "cursor-pointer border-3",
        },
        checked: {
            true: "border-rose-100",
            false: "",
        }
    },
    compoundVariants: [{
        disabled: true,
        checked: true,
        className: "border-3",
    }, {
        disabled: false,
        checked: false,
        className: "border-olive-200"
    }]
})

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
                <label className={checkboxLabelVariants({ disabled, checked: opt.selected })}>
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

const getRandomKey = () => Math.random().toString(36).substring(2);

type ImageSlot = {
    key: string
    existingId?: number
    existingFilepath?: string
    file?: File
    previewUrl: string
    removed: boolean
}

const toImageSlot = (image: PlantDefinition['images'][number] | undefined): ImageSlot => ({
    key: getRandomKey(),
    existingId: image?.id ?? undefined,
    existingFilepath: image?.filepath ?? undefined,
    file: undefined,
    previewUrl: image?.filepath ?? '',
    removed: false,
})

const buildInitialSlots = (images: PlantDefinition['images']): [ImageSlot, ImageSlot, ImageSlot] => {
    const byPosition = new Map(images.map((image) => [image.position, image]))

    return [
        toImageSlot(byPosition.get(0)),
        toImageSlot(byPosition.get(1)),
        toImageSlot(byPosition.get(2)),
    ]
}

export default function PlantDefinitionDetails({ definition, isEdit }: PlantDefinitionDetailsProps) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const [imageSlots, setImageSlots] = useState<[ImageSlot, ImageSlot, ImageSlot]>(() => buildInitialSlots(definition.images))
    const imageSlotsRef = useRef(imageSlots)
    const previousIsEditRef = useRef(isEdit)

    useEffect(() => {
        imageSlotsRef.current = imageSlots
    }, [imageSlots])

    useEffect(() => {
        return () => {
            for (const slot of imageSlotsRef.current) {
                if (slot.file && slot.previewUrl) {
                    URL.revokeObjectURL(slot.previewUrl)
                }
            }
        }
    }, [])

    useEffect(() => {
        if (previousIsEditRef.current && !isEdit) {
            setImageSlots((currentSlots) => {
                for (const slot of currentSlots) {
                    if (slot.file && slot.previewUrl) {
                        URL.revokeObjectURL(slot.previewUrl)
                    }
                }

                return buildInitialSlots(definition.images)
            })
        }

        previousIsEditRef.current = isEdit
    }, [definition.images, isEdit])

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

    const handleSelectImage = (slotIndex: number, file?: File | null) => {
        if (!file) return

        setImageSlots((currentSlots) => {
            const nextSlots = [...currentSlots] as typeof currentSlots
            const currentSlot = nextSlots[slotIndex]

            if (currentSlot.file && currentSlot.previewUrl) {
                URL.revokeObjectURL(currentSlot.previewUrl)
            }

            nextSlots[slotIndex] = {
                ...currentSlot,
                file,
                previewUrl: URL.createObjectURL(file),
                removed: false,
            }

            return nextSlots
        })
    }

    const handleRemoveImage = (slotIndex: number) => {
        setImageSlots((currentSlots) => {
            const nextSlots = [...currentSlots] as typeof currentSlots
            const slot = nextSlots[slotIndex]

            if (slot.file && slot.previewUrl) {
                URL.revokeObjectURL(slot.previewUrl)
            }

            if (slot.file && slot.existingFilepath) {
                nextSlots[slotIndex] = {
                    ...slot,
                    file: undefined,
                    previewUrl: slot.existingFilepath,
                    removed: false,
                }

                return nextSlots
            }

            if (slot.existingId && !slot.removed) {
                nextSlots[slotIndex] = {
                    ...slot,
                    file: undefined,
                    previewUrl: '',
                    removed: true,
                }

                return nextSlots
            }

            if (slot.removed && slot.existingFilepath) {
                nextSlots[slotIndex] = {
                    ...slot,
                    file: undefined,
                    previewUrl: slot.existingFilepath,
                    removed: false,
                }

                return nextSlots
            }

            nextSlots[slotIndex] = {
                ...slot,
                file: undefined,
                previewUrl: '',
                removed: false,
            }

            return nextSlots
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

            <div>
                {isEdit ? (
                    <div className="grid gap-2 grid-cols-3">
                        {imageSlots.map((slot, index) => (
                            <div key={slot.key} className="flex min-h-44 flex-col gap-2 border border-olive-300 p-2 rounded-sm">
                                <input
                                    type="hidden"
                                    name={`imageSlots[${index}][existingId]`}
                                    value={slot.existingId ?? ''}
                                    readOnly
                                />
                                <input
                                    type="hidden"
                                    name={`imageSlots[${index}][existingFilepath]`}
                                    value={slot.existingFilepath ?? ''}
                                    readOnly
                                />
                                <input
                                    type="hidden"
                                    name={`imageSlots[${index}][removed]`}
                                    value={slot.removed ? 'true' : 'false'}
                                    readOnly
                                />

                                {slot.previewUrl ? (
                                    <img className="h-32 w-full object-cover" src={slot.previewUrl} alt={`Imagen ${index + 1}`} />
                                ) : (
                                    <div className="h-32 w-full border border-dashed border-olive-300 grid place-content-center text-sm text-slate-500">
                                        Sin imagen
                                    </div>
                                )}

                                <label
                                    role="button"
                                    className="cursor-pointer px-2 py-1 text-center font-bold border border-rose-200 text-red-950"
                                >
                                    {slot.previewUrl ? 'Reemplazar imagen' : 'Agregar imagen'}
                                    <input
                                        name={`imageSlots[${index}][file]`}
                                        className="hidden"
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={({ currentTarget }) => handleSelectImage(index, currentTarget.files?.item(0))}
                                    />
                                </label>

                                <button
                                    className="text-sm px-2 py-1 border border-slate-300"
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                >
                                    Quitar
                                </button>
                            </div>
                        ))}
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
        </form>
    )
}
