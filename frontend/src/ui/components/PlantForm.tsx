import { useTransition, useState } from 'react'
import { buttonVariants } from '@/ui/classVariants/button'
import { cva } from 'class-variance-authority'
import { useNavigate } from '@/router/provider'
import { useCreatePlant } from '@/api/plants'

const inputVariants = cva([
  "border", "border-rose-200 p-2 rounded-lg",
], {
  variants: {},
})

export interface PlantFormProps { }

export default function PlantForm({ }: PlantFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const navigate = useNavigate()
  const createPlant = useCreatePlant()

  function submit(fd: FormData) {
    setError(null)
    setFieldError(null)

    startTransition(async () => {
      try {
        const result = await createPlant.mutateAsync({
          nickname: fd.get("nickname"),
          source: fd.get("source"),
          location: fd.get("location") || undefined,
          acquired_at: fd.get("acquiredAt") || undefined,
          notes: fd.get("notes") || undefined,
          plant_definition_id: Number(fd.get("plantDefinitionId")) || undefined,
        })

        if (result?.id) {
          navigate("/plants/:plantid", { params: { plantid: String(result.id) } })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado")
      }
    })
  }

  return (
    <form action={submit} className="mx-8 p-8 flex flex-col gap-8 border border-olive-200">
      <div className="flex justify-end gap-4">
        <button
          className={buttonVariants({ variant: 'secondary' })}
          type="reset"
          disabled={isPending}
          onClick={() => navigate("/plants")}
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={isPending}
          className={buttonVariants({ variant: 'primary' })}
        >
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      {/*<input type="hidden" name="plantDefinitionId" value={plantDefinitionId} />*/}

      <fieldset className="grid gap-8">
        <div className="flex flex-col gap-2">
          <label htmlFor="nickname">Nombre (apodo)</label>
          <input
            className={inputVariants()}
            id="nickname"
            name="nickname"
            type="text"
            placeholder="Mi monstera del balcon"
            minLength={1}
            disabled={isPending}
            required
            aria-invalid={fieldError === 'nickname'}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="source">Fuente</label>
          <input
            className={inputVariants()}
            id="source"
            name="source"
            type="text"
            placeholder="Regalo, compra, etc."
            minLength={1}
            disabled={isPending}
            required
            aria-invalid={fieldError === 'source'}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="location">Ubicacion (opcional)</label>
          <input
            className={inputVariants()}
            id="location"
            name="location"
            type="text"
            placeholder="Balcon, sala, habitacion..."
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="acquiredAt">Fecha de adquisicion (opcional)</label>
          <input
            className={inputVariants()}
            id="acquiredAt"
            name="acquiredAt"
            type="date"
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="notes">Notas (opcional)</label>
          <textarea
            className={inputVariants()}
            id="notes"
            name="notes"
            placeholder="Cualquier informacion adicional..."
            disabled={isPending}
            rows={3}
          />
        </div>
      </fieldset>
    </form>
  )
}
