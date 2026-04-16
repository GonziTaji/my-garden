import { notFound } from 'next/navigation'
import plantDefinitionsService from '@/services/plant-definitions.service'
import { plantCategory } from '@/domain/plants/category/plant-category'
import { lightLevel } from '@/domain/plants/light/light-level'
import { soilType } from '@/domain/plants/soil/soil-type'
import { petToxicity } from '@/domain/plants/toxicity/pet-toxicity'
import { waterProfile } from '@/domain/plants/water/water-profile'
import Link from 'next/link'
import Image from 'next/image'
import { cva } from 'class-variance-authority'
import SubmitButton from './components/SubmitButton'
import { buttonVariants } from './classVariants/button'
import { ImageSelector } from './components/ImageSelector'
import { DetailChecklist } from './components/DetailChecklist'
import styles from './styles.module.css'
import DeleteButton from './components/DeleteButton'


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

export default async function Page({ params, searchParams }: PageProps<"/catalog/[id]">) {
    const { id } = await params
    const plantDefinitionId = Number(id)

    if (isNaN(plantDefinitionId)) {
        notFound()
    }

    const current = await plantDefinitionsService.get(plantDefinitionId)
    if (!current) {
        notFound()
    }

    // @review: this can be generalized. But should it be generalized?
    const categoriesOptions = plantCategory.options.map((opt) => ({
        ...opt, selected: current.categories.includes(opt.value)
    }))

    const waterProfileOptions = waterProfile.options.map((opt) => ({
        ...opt,
        selected: current.waterProfile === opt.value
    }))

    const lightLevelOptions = lightLevel.options.map((opt) => ({
        ...opt,
        selected: current.lightLevel === opt.value
    }))

    const soilTypeOptions = soilType.options.map((opt) => ({
        ...opt,
        selected: current.soilType === opt.value
    }))

    const petToxicityOptions = petToxicity.options.map((opt) => ({
        ...opt,
        selected: current.petToxicity === opt.value
    }))

    // const disabled = !isEdit || isPending
    const { e } = await searchParams
    const isEdit = e === 'T'

    return (
        <div className='mx-2'>
            <form className="p-4 overflow-auto mb-12">
                <input name="id" type="hidden" defaultValue={current.id || ''} />

                <div className="flex justify-end gap-3 p-4">
                    <div className="grow flex gap-3">
                        <Link
                            className={buttonVariants({ variant: 'secondary', className: 'inline-block' })}
                            href="/catalog"
                        >
                            Catalogo
                        </Link>

                        <Link
                            className={buttonVariants({ variant: 'secondary', className: 'h-full inline-block' })}
                            href={`/catalog/${current.id}/plants`}
                        >
                            Plantas
                        </Link>
                    </div>

                    {isEdit ? (
                        <>
                            <SubmitButton />
                            <Link
                                href={`/catalog/${current.id}`}
                                className={buttonVariants({ variant: 'secondary' })}
                            >
                                Cancelar
                            </Link>
                        </>
                    ) : (
                        <Link
                            href={{ pathname: `/catalog/${current.id}`, query: { e: 'T' } }}
                            className={buttonVariants({ variant: 'primary' })}
                        >
                            Editar
                        </Link>
                    )}
                </div>

                <div className="border py-8 px-8">
                    <div className="flex flex-col min-w-0">
                        <input
                            className={namesInputVariants({ value: 'commonName', disabled: !isEdit })}
                            type="text"
                            name="commonName"
                            placeholder="Nombre común"
                            defaultValue={current.commonName}
                            disabled={!isEdit}
                        />
                        <input
                            className={namesInputVariants({ value: 'scientificName', disabled: !isEdit })}
                            type="text"
                            name="scientificName"
                            placeholder="Nombre scientifico"
                            defaultValue={current.scientificName}
                            disabled={!isEdit}
                        />
                    </div>

                    <div>
                        {isEdit ? (
                            <div className="grid gap-2 grid-cols-3">
                                {[0, 1, 2].map((n) =>
                                    <ImageSelector image={current.images[n]} key={n} />
                                )}
                            </div>
                        ) : (
                            <div className="grid gap-2 grid-cols-3">
                                {current.images.map((image) => (
                                    <Image
                                        width="200"
                                        height="200"
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
                            <DetailChecklist
                                options={categoriesOptions}
                                disabled={!isEdit}
                                type="checkbox"
                                name="categories"
                            />
                        </dd>

                        <dt>Ciclo de agua</dt>
                        <dd>
                            <DetailChecklist
                                options={waterProfileOptions}
                                disabled={!isEdit}
                                type="radio"
                                name="waterProfile"
                            />
                        </dd>

                        <dt>Nivel de luz</dt>
                        <dd>
                            <DetailChecklist
                                options={lightLevelOptions}
                                disabled={!isEdit}
                                type="radio"
                                name="lightLevel"
                            />
                        </dd>

                        <dt>Tipo de suelo</dt>
                        <dd>
                            <DetailChecklist
                                options={soilTypeOptions}
                                disabled={!isEdit}
                                type="radio"
                                name="soilType"
                            />
                        </dd>

                        <dt>Pet friendly?</dt>
                        {isEdit ? (
                            <dd className="flex gap-4">
                                <DetailChecklist
                                    className="flex-col"
                                    options={petToxicityOptions}
                                    disabled={!isEdit}
                                    type="radio"
                                    name="petToxicity"
                                />

                                <label className="grow text-start flex flex-col">
                                    <span className="block p-1">Notas:</span>
                                    <textarea
                                        className="border disabled:border-0 border-slate-300 rounded-sm not-disabled:w-full p-2 grow"
                                        name="symptoms"
                                        disabled={!isEdit}
                                        defaultValue={current.petToxicityNotes}
                                        placeholder="Una nota sobre algo..."
                                    >
                                    </textarea>
                                </label>
                            </dd>
                        ) : (
                            <dd className="text-start!">
                                <span>{petToxicity.meta[current.petToxicity].label}.</span>
                                <br />
                                <span className="text-sm italic">{current.petToxicityNotes}</span>
                            </dd>
                        )}

                        {isEdit && current.id && (
                            <>
                                <dt className="text-red-400 font-bold">DANGER ZONE</dt>
                                <DeleteButton plantdef={current} />

                            </>
                        )}

                    </dl>
                </div>
            </form>
        </div>
    )
}
