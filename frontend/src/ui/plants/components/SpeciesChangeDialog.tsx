import type { SyntheticEvent } from 'react'
import { useUpdatePlant } from '@/ui/plants/queries/plants'
import { useSpecies } from '@/ui/plant-species/queries/species'
import { buttonVariants } from '../../class-variants/button'
import { cn } from '@sglara/cn'
import { inputVariants } from '../../class-variants/input'

interface SpeciesChangeDialogProps {
  plantId: number
  currentSpeciesId: number
}

const speciesChangeActionTypes = {
  cancel: 'cancel',
  submit: 'submit',
} as const

type SpeciesChangeActionType = keyof typeof speciesChangeActionTypes

export function SpeciesChangeDialog({ plantId, currentSpeciesId }: SpeciesChangeDialogProps) {
  const updatePlant = useUpdatePlant()
  const { data: speciesList, isLoading: isSpeciesLoading } = useSpecies()

  async function handleClose(e: SyntheticEvent<HTMLDialogElement, Event>) {
    e.preventDefault()

    const ct = e.currentTarget
    const form = ct.querySelector('form')
    const action = ct.returnValue as SpeciesChangeActionType

    if (!form || !action) {
      console.warn('missing form and/or action in dialog close event handler')
      return
    }

    switch (action) {
      case 'cancel':
        form.reset()
        return

      case 'submit': {
        const fd = new FormData(form)

        const newSpeciesId = fd.get('new-species')?.toString()

        if (!newSpeciesId) {
          console.warn('no species selected in formdata')
          return
        }

        const speciesId = Number(newSpeciesId)
        if (speciesId === currentSpeciesId) {
          form.reset()
          return
        }

        await updatePlant.mutateAsync({
          nickname: '',
          plant_species_id: speciesId,
          images: [],
        })

        form.reset()

        return
      }

      default:
        break
    }
  }

  return (
    <dialog
      closedby="any"
      popover="auto"
      className={cn(
        'mt-8 mx-auto p-6 rounded-2xl',
        'transition-discrete transition-all duration-300',
        '-translate-y-32 opacity-0 open:translate-y-0 open:opacity-100',
        'starting:open:opacity-0 starting:open:-translate-y-32'
      )}
      id="create-species-change-dialog"
      onClose={handleClose}
    >
      <form method="dialog" className="grid gap-6">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-species" className="text-sm font-medium text-neutral-strong">
            Tipo de planta
          </label>
          {isSpeciesLoading ? (
            <span className="text-neutral-default">Cargando...</span>
          ) : (
            <select
              className={inputVariants()}
              id="new-species"
              name="new-species"
              defaultValue={currentSpeciesId}
              required
            >
              {speciesList?.map((species) => (
                <option key={species.id} value={species.id!}>
                  {species.commonName} ({species.scientificName})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            className={buttonVariants({ variant: 'secondary' })}
            value={speciesChangeActionTypes.cancel}
            formNoValidate
          >
            Cancelar
          </button>
          <button
            type="button"
            className={buttonVariants({ variant: 'primary' })}
            value={speciesChangeActionTypes.submit}
          >
            Guardar
          </button>
        </div>
      </form>
    </dialog>
  )
}
