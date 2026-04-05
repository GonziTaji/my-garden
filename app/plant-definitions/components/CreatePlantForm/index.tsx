'use client'

import { createPlant, ActionResult } from '../../actions'
import { useTransition, useState } from 'react'

export interface CreatePlantFormProps {
    plantDefinitionId: number
    onCreated?: (newPlantId: number) => void
}

export default function CreatePlantForm({ plantDefinitionId, onCreated }: CreatePlantFormProps) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [fieldError, setFieldError] = useState<string | null>(null)

    function submit(fd: FormData) {
        setError(null)
        setFieldError(null)

        startTransition(async () => {
            const result: ActionResult = await createPlant(fd)

            if (result.success && result.id) {
                onCreated?.(result.id)
            } else if (result.error) {
                setError(result.error)
                setFieldError(result.field ?? null)
            }
        })
    }

    return (
        <form className="new-plant-form" action={submit}>
            {error && (
                <div className="form-error" role="alert">
                    {error}
                </div>
            )}

            <input type="hidden" name="pplantDefinitionId" value={plantDefinitionId} />

            <div>
                <label htmlFor="nickname">Nombre (apodo)</label>
                <input
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

            <div>
                <label htmlFor="location">Ubicacion (opcional)</label>
                <input
                    id="location"
                    name="location"
                    type="text"
                    placeholder="Balcon, sala, habitacion..."
                    disabled={isPending}
                />
            </div>

            <div>
                <label htmlFor="acquiredAt">Fecha de adquisicion (opcional)</label>
                <input
                    id="acquiredAt"
                    name="acquiredAt"
                    type="date"
                    disabled={isPending}
                />
            </div>

            <div>
                <label htmlFor="notes">Notas (opcional)</label>
                <textarea
                    id="notes"
                    name="notes"
                    placeholder="Cualquier informacion adicional..."
                    disabled={isPending}
                    rows={3}
                />
            </div>

            <div className="form-actions">
                <button type="submit" disabled={isPending}>
                    {isPending ? 'Guardando...' : 'Guardar'}
                </button>
                <button type="reset" disabled={isPending}>
                    Limpiar
                </button>
            </div>
        </form>
    )
}
