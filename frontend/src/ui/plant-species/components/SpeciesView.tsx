import { DetailChecklist } from './DetailChecklist'
import DetailListItem from './DetailListItem'
import { SpeciesHeader } from './SpeciesHeader'
import { SpeciesPlantLinks } from './SpeciesPlantLinks'
import { useSpeciesSubmit } from '@/ui/plant-species/hooks/use-species-submit'
import { ImageManagerField, type ImageManagerHandle } from '@/ui/uploads/components/ImageManagerField'
import { cn } from '@sglara/cn'
import { plantCategory } from '@/domain/plants/category/plant-category'
import { lightLevel } from '@/domain/plants/light/light-level'
import type { PlantSpecies } from '@/domain/plants/plant-species'
import { soilType } from '@/domain/plants/soil/soil-type'
import { petToxicity } from '@/domain/plants/toxicity/pet-toxicity'
import { waterProfile } from '@/domain/plants/water/water-profile'
import { buttonVariants } from '@/ui/class-variants/button'
import { useDeleteSpecies } from '@/ui/plant-species/queries/species'
import { inputVariants } from '../../class-variants/input'
import { useAuth } from '@/auth/AuthContext'
import { useMemo, useState, useTransition, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'

interface SpeciesViewProps {
  record: PlantSpecies
  editMode: boolean
  fromPlantForm?: boolean
}

export default function SpeciesView({ record, editMode, fromPlantForm }: SpeciesViewProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isPending, startTransition] = useTransition()

  const deleteSpecies = useDeleteSpecies()
  const [favorited, setFavorited] = useState(record.isFavorited || false)

  const imageManagerRef = useRef<ImageManagerHandle>(null)
  const [imagePaths, setImagePaths] = useState<string[]>(
    record.images.map(({ filepath }) => filepath)
  )
  const [isUploading, setIsUploading] = useState(false)

  const { submitHandler, isPending: isSubmitting } = useSpeciesSubmit({
    record,
    fromPlantForm,
    imagePaths,
    commitDeletions: () => imageManagerRef.current?.commitDeletions() ?? Promise.resolve(),
  })

  const categoriesOptions = useMemo(
    () =>
      plantCategory.options.map((opt) => ({
        ...opt,
        selected: record.categories?.includes(opt.value) || false,
      })),
    [record.categories]
  )

  const waterProfileOptions = useMemo(
    () =>
      waterProfile.options.map((opt) => ({
        ...opt,
        selected: record.waterProfile === opt.value,
      })),
    [record.waterProfile]
  )

  const lightLevelOptions = useMemo(
    () =>
      lightLevel.options.map((opt) => ({
        ...opt,
        selected: record.lightLevel === opt.value,
      })),
    [record.lightLevel]
  )

  const soilTypeOptions = useMemo(
    () =>
      soilType.options.map((opt) => ({
        ...opt,
        selected: record.soilType === opt.value,
      })),
    [record.soilType]
  )

  const petToxicityOptions = useMemo(
    () =>
      petToxicity.options.map((opt) => ({
        ...opt,
        selected: record.petToxicity === opt.value,
      })),
    [record.petToxicity]
  )

  const isDeleted = !!record.deletedAt

  function handleDelete(id: number, name: string) {
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
      <form
        onSubmit={submitHandler}
        className="p-6 overflow-auto bg-surface-raised rounded-xl shadow-sm border border-neutral-subtle/30"
      >
        {isDeleted && (
          <div className="bg-danger-light border border-danger-subtle text-danger-strong px-4 py-3 rounded-lg text-sm mb-4">
            Este tipo de planta ha sido eliminado por su creador
          </div>
        )}
        <input name="id" type="hidden" defaultValue={record.id || ''} />

        <div className="pb-6">
          <SpeciesHeader
            editMode={editMode}
            isPending={isPending || isSubmitting || isUploading}
            isDeleted={isDeleted}
            record={record}
            user={user}
            favorited={favorited}
            onToggleFavorite={setFavorited}
          />

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
            <ImageManagerField
              ref={imageManagerRef}
              defaultImagePaths={record.images.map(({ filepath }) => filepath)}
              maxImages={3}
              readOnly={!editMode}
              onIsUploadingChange={setIsUploading}
              onImagePathsChange={setImagePaths}
            />
          </div>

          {!editMode && user && record.id && (
            <SpeciesPlantLinks recordId={record.id} isDeleted={isDeleted} />
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
