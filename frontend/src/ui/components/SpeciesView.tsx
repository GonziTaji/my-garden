import { ImageSelector } from './ImageSelector'
import { DetailChecklist } from './DetailChecklist'
import DeleteButton from './DeleteButton'
import DetailListItem from './DetailLstItem'
import { useTransition, useState } from 'react'
import { Link } from '@/router/components/Link'
import { useNavigate } from '@/router/provider'
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
  uploadSpeciesImage,
} from '@/api/species'
import { usePlants } from '@/api/plants'
import { inputVariants } from '../classVariants/input'
import { useAuth } from '@/auth/AuthContext'

interface SpeciesViewProps {
  record: PlantSpecies
  editMode: boolean
}

export default function SpeciesView({ record, editMode }: SpeciesViewProps) {
  const { user } = useAuth()
  const [isPending, startTransition] = useTransition()
  const navigate = useNavigate()
  const createSpecies = useCreateSpecies()
  const updateSpecies = useUpdateSpecies()
  const toggleFavorite = useToggleFavorite()
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
            const filepath = await uploadSpeciesImage(fileInput)
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

        navigate('/catalog/:plantspeciesid', {
          params: { plantspeciesid: String(result.id) },
        })
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  function handleCloneSpecies() {
    navigate('/catalog/new', {
      search: {
        commonName: record.commonName,
        scientificName: record.scientificName,
        waterProfile: record.waterProfile,
        lightLevel: record.lightLevel,
        soilType: record.soilType,
        petToxicity: record.petToxicity,
        petToxicityNotes: record.petToxicityNotes,
        categories: record.categories?.join(',') || '',
      },
    })
  }

  return (
    <div className="mx-2">
      <form className="p-4 overflow-auto mb-12">
        {isDeleted && (
          <div className="bg-warning-soft border border-warning-strong text-warning-strong px-4 py-3 rounded-md mb-4">
            Este tipo de planta ha sido eliminado por su creador
          </div>
        )}
        <input name="id" type="hidden" defaultValue={record.id || ''} />

        <div className="border py-8 px-8">
          <div className="flex gap-4 justify-end">
            {editMode && !isDeleted ? (
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
                  to="back"
                  className={buttonVariants({ variant: 'secondary' })}
                >
                  Cancelar
                </Link>
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
                        const result = await toggleFavorite.mutateAsync(
                          record.id!
                        )
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
                    to="/catalog/:plantspeciesid"
                    params={{ plantspeciesid: String(record.id) }}
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
              placeholder="Nombre scientifico"
              defaultValue={record.scientificName}
              disabled={!editMode}
            />
          </div>

          <div>
            {editMode ? (
              <div className="grid gap-2 grid-cols-3">
                {[0, 1, 2].map((n) => (
                  <ImageSelector
                    image={record.images[n]}
                    key={n}
                    position={n}
                  />
                ))}
              </div>
            ) : (
              <div className="grid gap-2 grid-cols-3">
                {record.images.map((image) => (
                  <img
                    width="200"
                    height="200"
                    key={image.id}
                    className="h-32 w-full object-cover border border-secondary-default rounded-sm"
                    src={image.filepath}
                    alt="Imagen de planta"
                  />
                ))}
              </div>
            )}
          </div>

          {!editMode && user && record.id && (
            <div>
              <hr className="my-4 border-secondary-subtle" />
              <h3 className="font-semibold text-secondary-dark mb-2">
                Mis plantas de esta especie
              </h3>
              <div className="flex flex-col gap-1 mb-4">
                {linkedPlants?.map((plant) => (
                  <Link
                    key={plant.id}
                    to="/plants/:plantid"
                    params={{ plantid: String(plant.id) }}
                    className="flex items-center gap-3 p-2 rounded-sm hover:bg-primary-subtle"
                  >
                    <div className="w-10 h-10 rounded-sm overflow-hidden bg-secondary-default shrink-0">
                      {plant.images[0]?.filepath ? (
                        <img
                          src={plant.images[0].filepath}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-secondary-strong">
                          ?
                        </div>
                      )}
                    </div>
                    <span>{plant.nickname}</span>
                  </Link>
                ))}
              </div>

              <p className="text-secondary-strong mb-4">
                {!linkedPlants?.length && <span>Sin plantas.</span>}

                {!isDeleted && (
                  <Link
                    to="/plants/new"
                    search={{ plant_species_id: String(record.id) }}
                    className="text-primary-strong underline"
                  >
                    Nueva
                  </Link>
                )}
              </p>
              <hr className="my-4 border-secondary-subtle" />
            </div>
          )}

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
                <div className="grid grid-cols-[max-content_1fr] justify-between">
                  <DetailChecklist
                    className="flex-col"
                    options={petToxicityOptions}
                    disabled={!editMode}
                    type="radio"
                    name="petToxicity"
                  />

                  <label className="grow text-start flex flex-col">
                    <span className="block p-1 text-center">Notas:</span>
                    <textarea
                      className="border disabled:border-0 border-neutral-subtle rounded-sm not-disabled:w-full p-2 grow"
                      name="petToxicityNotes"
                      disabled={!editMode}
                      defaultValue={record.petToxicityNotes}
                      placeholder="Genera vómitos leves"
                    ></textarea>
                  </label>
                </div>
              ) : (
                <div className="text-start!">
                  <span>{petToxicity.meta[record.petToxicity].label}.</span>
                  <br />
                  <span className="text-sm italic">
                    {record.petToxicityNotes}
                  </span>
                </div>
              )}
            </DetailListItem>

            <DetailListItem title="Notas">
              {editMode ? (
                <textarea
                  className="border border-neutral-subtle rounded-sm w-full p-2"
                  name="notes"
                  defaultValue={record.notes}
                  placeholder="Notas adicionales sobre el tipo de planta"
                ></textarea>
              ) : (
                <span className="text-sm italic whitespace-pre-wrap">
                  {record.notes}
                </span>
              )}
            </DetailListItem>

            {editMode && !isDeleted && record.id && user && (
              <div className="text-danger-default">
                <DetailListItem title="DANGER ZONE">
                  <DeleteButton plantspecies={record} />
                </DetailListItem>
              </div>
            )}
          </dl>
        </div>
      </form>
    </div>
  )
}
