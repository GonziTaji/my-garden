'use client'

import { cva } from 'class-variance-authority'
import { ImageSelector } from './ImageSelector'
import { DetailChecklist } from './DetailChecklist'
import DeleteButton from './DeleteButton'
import DetailListItem from './DetailLstItem'
import { useTransition } from 'react'
import { Link } from '@tanstack/react-router'
import { plantCategory } from '@/domain/plants/category/plant-category'
import { lightLevel } from '@/domain/plants/light/light-level'
import type { PlantDefinition } from '@/domain/plants/plant-definition'
import { soilType } from '@/domain/plants/soil/soil-type'
import { petToxicity } from '@/domain/plants/toxicity/pet-toxicity'
import { waterProfile } from '@/domain/plants/water/water-profile'
import { buttonVariants } from '@/ui/classVariants/button'
import { upsertPlantDefinition } from '@/actions/plant-definition.actions'

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

interface DefinitionViewProps {
  record: PlantDefinition
  editMode: boolean
}

export default function DefinitionView({ record, editMode }: DefinitionViewProps) {
  const [isPending, startTransition] = useTransition()

  // @review: this can be generalized. But should it be generalized?
  const categoriesOptions = plantCategory.options.map((opt) => ({
    ...opt, selected: record.categories.includes(opt.value)
  }))

  const waterProfileOptions = waterProfile.options.map((opt) => ({
    ...opt,
    selected: record.waterProfile === opt.value
  }))

  const lightLevelOptions = lightLevel.options.map((opt) => ({
    ...opt,
    selected: record.lightLevel === opt.value
  }))

  const soilTypeOptions = soilType.options.map((opt) => ({
    ...opt,
    selected: record.soilType === opt.value
  }))

  const petToxicityOptions = petToxicity.options.map((opt) => ({
    ...opt,
    selected: record.petToxicity === opt.value
  }))

  const submitAction = async (fd: FormData) => {
    startTransition(async () => {
      const { error } = await upsertPlantDefinition(fd)

      if (error) {
        alert(error)
      }
    })
  }

  return (
    <div className='mx-2'>
      <form className="p-4 overflow-auto mb-12">
        <input name="id" type="hidden" defaultValue={record.id || ''} />


        <div className="border py-8 px-8">
          <div className='flex gap-4 justify-end'>
            {editMode ? (
              <>
                <button
                  className={buttonVariants({ variant: 'primary' })}
                  formAction={submitAction}
                  type="submit"
                  disabled={isPending}
                >
                  {isPending ? 'Guardando' : 'Guardar'}
                </button>

                <Link
                  to="/catalog/$plantdefid"
                  params={{ plantdefid: String(record.id) }}
                  className={buttonVariants({ variant: 'secondary' })}
                >
                  Cancelar
                </Link>
              </>
            ) : (
              <Link
                to="/catalog/$plantdefid"
                params={{ plantdefid: String(record.id) }}
                search={{ e: 'T' }}
                className={buttonVariants({ variant: 'primary' })}
              >
                Editar
              </Link>
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <input
              className={namesInputVariants({ value: 'commonName', disabled: !editMode })}
              type="text"
              name="commonName"
              placeholder="Nombre común"
              defaultValue={record.commonName}
              disabled={!editMode}
            />
            <input
              className={namesInputVariants({ value: 'scientificName', disabled: !editMode })}
              type="text"
              name="scientificName"
              placeholder="Nombre scientifico"
              defaultValue={record.scientificName}
              disabled={!editMode}
            />
          </div>

          <div>
            {editMode ? (
              <div className="grid gap-2 grid-cols-3">
                {[0, 1, 2].map((n) =>
                  <ImageSelector image={record.images[n]} key={n} />
                )}
              </div>
            ) : (
              <div className="grid gap-2 grid-cols-3">
                {record.images.map((image) => (
                  <img
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

          <dl className="flex flex-col gap-2">
            <DetailListItem title="Tipo de planta">
              <DetailChecklist
                options={categoriesOptions}
                disabled={!editMode}
                type="checkbox"
                name="categories"
              />
            </DetailListItem>

            <DetailListItem title="Ciclo de agua">
              <DetailChecklist
                options={waterProfileOptions}
                disabled={!editMode}
                type="radio"
                name="waterProfile"
              />
            </DetailListItem>

            <DetailListItem title="Nivel de luz">
              <DetailChecklist
                options={lightLevelOptions}
                disabled={!editMode}
                type="radio"
                name="lightLevel"
              />
            </DetailListItem>

            <DetailListItem title="Tipo de suelo">
              <DetailChecklist
                options={soilTypeOptions}
                disabled={!editMode}
                type="radio"
                name="soilType"
              />
            </DetailListItem>

            <DetailListItem title="Pet friendly?">
              {editMode ? (
                <div className="flex gap-4">
                  <DetailChecklist
                    className="flex-col"
                    options={petToxicityOptions}
                    disabled={!editMode}
                    type="radio"
                    name="petToxicity"
                  />

                  <label className="grow text-start flex flex-col">
                    <span className="block p-1">Notas:</span>
                    <textarea
                      className="border disabled:border-0 border-slate-300 rounded-sm not-disabled:w-full p-2 grow"
                      name="symptoms"
                      disabled={!editMode}
                      defaultValue={record.petToxicityNotes}
                      placeholder="Una nota sobre algo..."
                    >
                    </textarea>
                  </label>
                </div>
              ) : (
                <div className="text-start!">
                  <span>{petToxicity.meta[record.petToxicity].label}.</span>
                  <br />
                  <span className="text-sm italic">{record.petToxicityNotes}</span>
                </div>
              )}
            </DetailListItem>

            {editMode && record.id && (
              <div className="text-red-400">
                <DetailListItem title="DANGER ZONE">
                  <DeleteButton plantdef={record} />
                </DetailListItem>
              </div>

            )}

          </dl>
        </div>
      </form>
    </div>
  )
}
