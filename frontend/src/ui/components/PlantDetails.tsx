import { useCreateLocationChange, useUpdatePlant, type CreateLocationChangeInput } from "@/api/plants"
import type { PlantWithDefinition } from "@/domain/plants/plant"
import { toISODateString } from "@/utils/format-date"
import type { SyntheticEvent } from "react"
import { buttonVariants } from "../classVariants/button"
import { cn } from "@sglara/cn"
import { inputVariants } from "../classVariants/input"

interface PlantDetailProps {
  plant: PlantWithDefinition
  editMode: boolean
}

const locationChangeActionTypes = { cancel: "cancel", submit: "submit" } as const

type LocationChangeActionType = keyof typeof locationChangeActionTypes

export default function PlantDetails({ plant }: PlantDetailProps) {
  const updatePlant = useUpdatePlant(plant.id)
  const createLocationChange = useCreateLocationChange()

  //native dialog to change the location
  //dialog should ask for the new location name, the date of the change (default current date) and any notes.
  //to submit the dialog the location name and date must be populated

  async function handleLocationChangeDialogClose(e: SyntheticEvent<HTMLDialogElement, Event>) {
    e.preventDefault()

    const ct = e.currentTarget
    const form = ct.querySelector('form')
    const action = ct.returnValue as LocationChangeActionType

    if (!form || !action) {
      console.warn("missing form and/or action in dialog close event handler")
      return
    }

    switch (action) {
      case "cancel":
        form.reset()
        // do something here?
        return;

      case "submit":
        const fd = new FormData(form)

        const mutationInput: CreateLocationChangeInput = {
          location: fd.get("new-location")?.toString() || '',
          plant_id: plant.id,
          registered_at: fd.get("new-location-date")?.toString() || '',
          notes: fd.get("new-location-notes")?.toString() || '',
        }

        if (!mutationInput.location) {
          console.warn("no location in formdata")
          return
        }

        if (!mutationInput.registered_at) {
          console.warn("no date in formdata")
          return
        }

        const res = await createLocationChange.mutateAsync(mutationInput)
        console.log(res)

        form.reset()

        return;

      default:
        break;
    }

    console.log()

  }

  return (
    <section className="plant-detail">
      <input type="text" name="nickname" defaultValue={plant.nickname} disabled />

      <div>
        <span>{plant.definition.commonName}</span>
        <span>{plant.definition.scientificName}</span>
      </div>

      <div>
        <span>
          Ubicacion: {plant.location}
        </span>
        <button className={buttonVariants({ variant: "tertiary" })} command="show-modal" commandfor="create-location-change-dialog">Cambiar</button>
      </div>

      <span>Fecha de adquisicion</span>
      <span>{plant.acquiredAt?.toLocaleDateString() || "-"}</span>

      <span>Notas: </span>
      <span>{plant.notes || "-"}</span>

      <dialog closedby="any" popover="auto" className={cn(
        "mt-20 mx-auto p-4 shadow-lg rounded-md",
        "transition-discrete transition-all duration-300",
        "-translate-y-32 opacity-0 open:translate-y-0 open:opacity-100",
        "starting:open:opacity-0 starting:open:-translate-y-32",

      )}
        id="create-location-change-dialog" onClose={handleLocationChangeDialogClose}
      >
        <form method="dialog" className="grid gap-4">
          <label className="grid">
            Lugar:
            <input autoComplete="false" className={inputVariants()} type="text" name="new-location" placeholder="Ventanal derecho" required />
          </label>

          <label className="grid">
            Fecha cambio:
            <input className={inputVariants()} type="date" name="new-location-date" defaultValue={toISODateString()} required />
          </label>

          <label className="grid">
            Notas:
            <textarea className={inputVariants()} name="new-location-notes" placeholder="Por cambio de temporada" />
          </label>


          <div className="flex justify-between">
            <button className={buttonVariants({ variant: "secondary" })} value={locationChangeActionTypes.cancel} formNoValidate>Cancelar</button>
            <button className={buttonVariants({ variant: "primary" })} value={locationChangeActionTypes.submit}>Guardar</button>
          </div>
        </form>
      </dialog>
    </section >
  )
}
