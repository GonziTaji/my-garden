'use client'

import { upsertPlant, ActionResult } from '@/ui/actions/actions'
import { useTransition, useState } from 'react'
import { buttonVariants } from '../classVariants/button'
import { useRouter } from 'next/navigation'
import { cva } from 'class-variance-authority'

export interface PlantFormProps {
    plantDefinitionId: number
    onCreated?: (newPlantId: number) => void
}

const inputVariants = cva([
    "border", "border-rose-200 p-2 rounded-lg",
], {
    variants: {},
})

export default function PlantForm({ plantDefinitionId, onCreated }: PlantFormProps) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [fieldError, setFieldError] = useState<string | null>(null)
    const router = useRouter()

    function submit(fd: FormData) {
        setError(null)
        setFieldError(null)

        startTransition(async () => {
            const result: ActionResult = await upsertPlant(fd)

            if (result.success && result.id) {
                onCreated?.(result.id)
            } else if (result.error) {
                setError(result.error)
                setFieldError(result.field ?? null)
            }
        })
    }

    return (
        <form action={submit} className="flex flex-col gap-8">
            <div className="flex justify-between">
                <button
                    className={buttonVariants({ variant: 'secondary' })}
                    type="reset"
                    disabled={isPending}
                    onClick={router.back}
                >
                    Volver
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

            <input type="hidden" name="plantDefinitionId" value={plantDefinitionId} />

            <fieldset className="border border-olive-200 p-8 grid gap-8">
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
