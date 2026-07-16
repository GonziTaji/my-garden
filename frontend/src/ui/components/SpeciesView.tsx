import { ImageSelector } from './ImageSelector'
import { DetailChecklist } from './DetailChecklist'
import DetailListItem from './DetailLstItem'
import { useTransition, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { cn } from '@sglara/cn'
import { plantCategory } from '@/domain/plants/category/plant-category'
import { lightLevel } from '@/domain/plants/light/light-level'
import type { PlantSpecies } from '@/domain/plants/plant-species'
import { soilType } from '@/domain/plants/soil/soil-type'
import { petToxicity } from '@/domain/plants/toxicity/pet-toxicity'
import { waterProfile } from '@/domain/plants/water/water-profile'
import { buttonVariants } from '@/ui/classVariants/button'
import {
  useCreateSpecies,
  useUpdateSpecies,
  useToggleFavorite,
  useDeleteSpecies,
} from '@/api/species'
import { usePlants } from '@/api/plants'
import { useImageUploads } from '@/api/uploads'
import { inputVariants } from '../classVariants/input'
import { useAuth } from '@/auth/AuthContext'

interface SpeciesViewProps {
  record: PlantSpecies
  editMode: boolean
  fromPlantForm?: boolean
}

export default function SpeciesView({ record, editMode, fromPlantForm }: SpeciesViewProps) {
  const { user } = useAuth()
  const [isPending, startTransition] = useTransition()
  const navigate = useNavigate()

  const createSpecies = useCreateSpecies()
  const deleteSpecies = useDeleteSpecies()
  const updateSpecies = useUpdateSpecies()
  const toggleFavorite = useToggleFavorite()
  const { uploadImage } = useImageUploads()

  const [favorited, setFavorited] = useState(record.isFavorited || false)

  const categoriesOptions = plantCategory.options.map((opt) => ({
    ...opt,
    selected: record.categories?.includes(opt.value) || false,
  }))

  const waterProfileOptions = waterProfile.options.map((opt) => ({
    ...opt,
    selected: record.waterProfile === opt.value,
  }))

  const lightLevelOptions = lightLevel.options.map((opt) => ({
    ...opt,
    selected: record.lightLevel === opt.value,
  }))

  const soilTypeOptions = soilType.options.map((opt) => ({
    ...opt,
    selected: record.soilType === opt.value,
  }))

  const petToxicityOptions = petToxicity.options.map((opt) => ({
    ...opt,
    selected: record.petToxicity === opt.value,
  }))

  const { data: linkedPlants } = usePlants(record.id ?? undefined)
  const isDeleted = !!record.deletedAt

  const submitAction = async (fd: FormData) => {
    startTransition(async () => {
      try {
        const images: { filepath: string; position: number }[] = []

        for (let pos = 0; pos < 3; pos++) {
          const fileInput = fd.get(`imagesFile_${pos}`)
          if (fileInput instanceof File && fileInput.size > 0) {
            const { error, filepath } = await uploadImage(fileInput)
            if (error) {
              throw new Error('Error al subir imagen')
            }
            images.push({ filepath, position: pos })
          } else {
            const existingPath = fd.get(`imagesExistingId_${pos}`)
            if (existingPath) {
              images.push({ filepath: String(existingPath), position: pos })
            }
          }
        }

        const categories = fd.getAll('categories') as string[]

        const getStrValue = (key: string) => fd.get(key)?.toString() ?? ''

        const payload = {
          common_name: getStrValue('commonName'),
          scientific_name: getStrValue('scientificName'),
          water_profile: getStrValue('waterProfile'),
          light_level: getStrValue('lightLevel'),
          soil_type: getStrValue('soilType'),
          pet_toxicity: getStrValue('petToxicity'),
          pet_toxicity_notes: getStrValue('petToxicityNotes'),
          notes: getStrValue('notes'),
          categories,
          images,
        }

        let result: { id: number }
        if (record.id) {
          result = await updateSpecies.mutateAsync({
            id: record.id,
            ...payload,
          })
        } else {
          result = await createSpecies.mutateAsync(payload)
        }

        if (fromPlantForm) {
          navigate({
            to: '/plants/new',
            search: { plantSpeciesId: result.id },
          })
        } else {
          navigate({
            to: '/catalog/$plantspeciesid',
            params: { plantspeciesid: String(result.id) },
          })
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  function handleCloneSpecies() {
    if (record.id) {
      navigate({ to: '/catalog/new', search: { clonedFrom: record.id } })
    }
  }

  const handleDelete = (id: number, name: string) => {
    const confirmed = confirm(
      `Esto eliminara el tipo "${name}" y todas sus plantas asociadas. ¿Continuar?`
    )

    if (!confirmed) return

    startTransition(async () => {
      try {
        await deleteSpecies.mutateAsync(id)
        navigate({ to: '/catalog' })
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Error al eliminar')
      }
    })
  }

  return (
    <div className="mx-4 my-4">
      <form className="p-6 overflow-auto bg-surface-raised rounded-xl shadow-sm border border-neutral-subtle/30">
        {isDeleted && (
          <div className="bg-danger-light border border-danger-subtle text-danger-strong px-4 py-3 rounded-lg text-sm mb-4">
            Este tipo de planta ha sido eliminado por su creador
          </div>
        )}
        <input name="id" type="hidden" defaultValue={record.id || ''} />

        <div className="pb-6">
          <div className="flex gap-3 justify-end mb-6">
            {editMode && !isDeleted ? (
              <>
                <button
                  className={buttonVariants({ variant: 'primary' })}
                  formAction={submitAction}
                  type="submit"
                  disabled={isPending}
                >
                  {isPending ? 'Guardando...' : 'Guardar'}
                </button>

                <button
                  type="button"
                  onClick={() => history.back()}
                  className={buttonVariants({ variant: 'secondary' })}
                >
                  Cancelar
                </button>
              </>
            ) : user && !isDeleted ? (
              <>
                {user.id !== record.userId && (
                  <>
                    <button
                      type="button"
                      onClick={handleCloneSpecies}
                      className={buttonVariants({ variant: 'secondary' })}
                    >
                      Clonar
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const result = await toggleFavorite.mutateAsync(record.id!)
                        setFavorited(result.favorited)
                      }}
                      className={buttonVariants({ variant: 'clean' })}
                    >
                      {favorited ? '♥' : '♡'}
                    </button>
                  </>
                )}
                {user.id === record.userId && (
                  <Link
                    to="/catalog/$plantspeciesid"
                    params={{ plantspeciesid: String(record.id!) }}
                    search={{ e: 'T' }}
                    className={buttonVariants({ variant: 'primary' })}
                  >
                    Editar
                  </Link>
                )}
              </>
            ) : null}
          </div>

          <div className="flex flex-col min-w-0">
            <input
              className={inputVariants({
                field: 'commonName',
                disabled: !editMode,
              })}
              type="text"
              name="commonName"
              placeholder="Nombre común"
              defaultValue={record.commonName}
              disabled={!editMode}
            />
            <input
              className={inputVariants({
                field: 'scientificName',
                disabled: !editMode,
              })}
              type="text"
              name="scientificName"
              placeholder="Nombre científico"
              defaultValue={record.scientificName}
              disabled={!editMode}
            />
          </div>

          <div className="mt-4">
            {editMode ? (
              <div className="grid gap-3 grid-cols-3">
                {[0, 1, 2].map((n) => (
                  <ImageSelector image={record.images[n]} key={n} position={n} />
                ))}
              </div>
            ) : (
              <div className="grid gap-3 grid-cols-3">
                {record.images.map((image) => (
                  <img
                    width="200"
                    height="200"
                    key={image.id}
                    className="h-32 w-full object-cover border border-neutral-subtle/30 rounded-xl"
                    src={image.filepath}
                    alt="Imagen de planta"
                  />
                ))}
              </div>
            )}
          </div>

          {!editMode && user && record.id && (
            <div>
              <hr className="my-6 border-neutral-subtle/40" />
              <h3 className="font-semibold text-neutral-dark mb-3">Mis plantas de esta especie</h3>
              <div className="flex flex-col gap-1 mb-4">
                {linkedPlants?.map((plant) => (
                  <Link
                    key={plant.id}
                    to="/plants/$plantid"
                    params={{ plantid: String(plant.id) }}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-primary-subtle/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-primary-light shrink-0">
                      {plant.images[0]?.filepath ? (
                        <img
                          src={plant.images[0].filepath}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-neutral-default">
                          ?
                        </div>
                      )}
                    </div>
                    <span className="text-neutral-dark">{plant.nickname}</span>
                  </Link>
                ))}
              </div>

              <p className="text-neutral-strong mb-4">
                {!linkedPlants?.length && <span>Sin plantas.</span>}

                {!isDeleted && (
                  <Link
                    to="/plants/new"
                    search={{ plantSpeciesId: record.id }}
                    className="text-primary-dark hover:text-primary-strong hover:underline transition-colors ml-1"
                  >
                    Nueva
                  </Link>
                )}
              </p>
              <hr className="my-6 border-neutral-subtle/40" />
            </div>
          )}

          <dl className="flex flex-col gap-4">
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
                <div className="grid grid-cols-[max-content_1fr] justify-between gap-4">
                  <DetailChecklist
                    className="flex-col"
                    options={petToxicityOptions}
                    disabled={!editMode}
                    type="radio"
                    name="petToxicity"
                  />

                  <label className="grow text-start flex flex-col">
                    <span className="block p-1 text-center text-sm font-medium text-neutral-strong">
                      Notas:
                    </span>
                    <textarea
                      className="border border-neutral-subtle/60 rounded-lg not-disabled:w-full p-2 grow bg-surface-raised text-neutral-dark placeholder:text-neutral-default focus:outline-none focus:border-primary-strong focus:ring-2 focus:ring-primary-subtle transition-all"
                      name="petToxicityNotes"
                      disabled={!editMode}
                      defaultValue={record.petToxicityNotes}
                      placeholder="Genera vómitos leves"
                    ></textarea>
                  </label>
                </div>
              ) : (
                <div className="text-start!">
                  <span className="text-neutral-dark">
                    {petToxicity.meta[record.petToxicity].label}.
                  </span>
                  <br />
                  <span className="text-sm italic text-neutral-strong">
                    {record.petToxicityNotes}
                  </span>
                </div>
              )}
            </DetailListItem>

            <DetailListItem title="Notas">
              {editMode ? (
                <textarea
                  className="border border-neutral-subtle/60 rounded-lg w-full p-2.5 bg-surface-raised text-neutral-dark placeholder:text-neutral-default focus:outline-none focus:border-primary-strong focus:ring-2 focus:ring-primary-subtle transition-all"
                  name="notes"
                  defaultValue={record.notes}
                  placeholder="Notas adicionales sobre el tipo de planta"
                ></textarea>
              ) : (
                <span className="text-sm italic whitespace-pre-wrap text-neutral-dark">
                  {record.notes}
                </span>
              )}
            </DetailListItem>

            {editMode && !isDeleted && record.id && user && (
              <div className="text-danger-default">
                <DetailListItem title="Zona de peligro">
                  <button
                    type="button"
                    className={cn(buttonVariants({ variant: 'danger' }))}
                    onClick={() => handleDelete(record.id!, record.commonName)}
                    disabled={isPending}
                  >
                    {isPending ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </DetailListItem>
              </div>
            )}
          </dl>
        </div>
      </form>
    </div>
  )
}
