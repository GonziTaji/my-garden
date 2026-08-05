import type { PlantWithSpecies } from '@/domain/plants/plant'
import { useState } from 'react'
import { buttonVariants } from '../../class-variants/button'
import { inputVariants } from '../../class-variants/input'
import { Link, useNavigate } from '@tanstack/react-router'
import { ImageManagerField } from '@/ui/uploads/components/ImageManagerField'
import { LocationChangeDialog } from './LocationChangeDialog'
import { SpeciesChangeDialog } from './SpeciesChangeDialog'
import PlantCalendar from './PlantCalendar'
import { useMonthSelector } from '@/ui/shared/hooks/use-month-selector'
import DateUtils from '@/utils/dates'
import { useSpeciesById } from '@/ui/plant-species/queries/species'
import { useToggleWatering } from '@/ui/plants/queries/watering'

interface PlantDetailProps {
  plant: PlantWithSpecies
}

export default function PlantDetails({ plant }: PlantDetailProps) {
  const [editingField, setEditingField] = useState<'nickname' | 'acquiredAt' | 'notes' | null>(null)
  const [editingImages, setEditingImages] = useState(false)
  const navigate = useNavigate()
  const toggleWatering = useToggleWatering()
  const { data: species, isLoading: isSpeciesLoading } = useSpeciesById(plant?.species.id!)

  const { monthIndex, year, setPreviousMonth, setNextMonth } = useMonthSelector({
    defaultMonthIndex: new Date().getMonth(),
    defaultYear: new Date().getFullYear(),
  })

  function handleImagePathsChange() {}

  return (
    <section className="mx-4 my-4 p-6 flex flex-col gap-6 bg-surface-raised rounded-xl shadow-sm border border-neutral-subtle/30">
      {plant.species.deletedAt && (
        <div className="bg-danger-light border border-danger-subtle text-danger-strong px-4 py-3 rounded-lg text-sm">
          Esta planta usa un tipo de planta que ha sido eliminado por su creador
        </div>
      )}

      <button
        className={buttonVariants({ variant: 'secondary' })}
        type="button"
        onClick={() =>
          navigate({
            to: '/plants/$plantid/edit',
            params: { plantid: String(plant.id) },
          })
        }
      >
        Editar
      </button>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="nickname" className="text-sm font-medium text-neutral-strong">
          Nombre (apodo)
        </label>
        <input
          type="text"
          id="nickname"
          name="nickname"
          defaultValue={plant.nickname}
          className={inputVariants({
            disabled: editingField !== 'nickname',
            className: 'text-2xl',
          })}
          onClick={() => setEditingField('nickname')}
          onBlur={() => setEditingField(null)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-strong">Tipo</label>

        <span className="flex gap-3 items-center">
          <Link to="/catalog">
            <div className="p-3 flex gap-2 baseline group items-center border rounded-md border-primary-strong bg-primary-default">
              {isSpeciesLoading && '...'}
              {species && (
                <>
                  <img className="aspect-square w-12 rounded-sm" src={species.images[0].filepath} />

                  <div className="flex flex-col items-baseline">
                    <span className="text-lg font-medium text-neutral-dark group-hover:text-primary-dark transition-colors">
                      {species.commonName}
                    </span>

                    <span className="italic text-xs text-neutral-strong">
                      {species.scientificName}
                    </span>
                  </div>
                </>
              )}
            </div>
          </Link>
          <button
            className={buttonVariants({ variant: 'clean', size: 'sm' })}
            command="show-modal"
            commandfor="create-species-change-dialog"
          >
            Cambiar
          </button>
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-strong">Ubicación</label>
        <span className="flex gap-3 items-center">
          <span className="text-neutral-dark">{plant.location}</span>
          <button
            className={buttonVariants({ variant: 'clean', size: 'sm' })}
            command="show-modal"
            commandfor="create-location-change-dialog"
          >
            Cambiar
          </button>
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-strong">Adquirida en</label>
        <span className="text-neutral-dark">{plant.acquiredAt?.toLocaleDateString() || '-'}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-neutral-strong">
          Notas
        </label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={plant.notes || ''}
          placeholder="-"
          className={inputVariants({
            disabled: editingField !== 'notes',
          })}
          onClick={() => setEditingField('notes')}
          onBlur={() => setEditingField(null)}
        />
      </div>

      <hr className="border-neutral-subtle/40" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-neutral-strong">Imágenes</label>
          <button
            type="button"
            className={buttonVariants({ variant: 'clean', size: 'sm' })}
            onClick={() => setEditingImages(!editingImages)}
          >
            {editingImages ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        <ImageManagerField
          defaultImagePaths={plant.images.map(({ filepath }) => filepath)}
          readOnly={!editingImages}
          onImagePathsChange={handleImagePathsChange}
        />
      </div>

      <hr className="border-neutral-subtle/40" />

      <div>
        <span className="text-sm font-medium text-neutral-strong">Eventos</span>

        <span className="block text-center">{DateUtils.toMonthDisplayValue(monthIndex, year)}</span>

        <div className="flex gap-2 items-center justify-center">
          <button
            type="button"
            onClick={setPreviousMonth}
            className={buttonVariants({ variant: 'primary', className: 'min-w-min' })}
          >
            &lt;
          </button>

          <div className="shadow-sm ">
            <PlantCalendar plantId={plant.id} monthIndex={monthIndex} year={year} />
          </div>

          <button
            type="button"
            onClick={setNextMonth}
            className={buttonVariants({ variant: 'primary', className: 'min-w-min' })}
          >
            &gt;
          </button>
        </div>

        <div className="pt-4 flex justify-center gap-4">
          <button
            type="button"
            className={buttonVariants({ variant: 'primary' })}
            onClick={() =>
              toggleWatering.mutate({
                plantId: plant.id,
                date: DateUtils.toInputValue(new Date()),
              })
            }
          >
            Riego rapido
          </button>

          <button type="button" className={buttonVariants({ variant: 'primary' })}>
            Crear evento
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Link
          to="/catalog/$plantspeciesid/new-plant"
          params={{ plantspeciesid: String(plant.species.id) }}
          className={buttonVariants({ variant: 'secondary' })}
        >
          Clonar planta
        </Link>
      </div>

      <LocationChangeDialog plantId={plant.id} />
      <SpeciesChangeDialog plantId={plant.id} currentSpeciesId={plant.species.id!} />
    </section>
  )
}
