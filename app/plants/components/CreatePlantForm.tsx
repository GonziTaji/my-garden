'use client'

import { createPlant, ActionResult } from '../actions'
import { useTransition, useState } from 'react'
import type { PlantDefinitionRow } from '@/db/stores/plant-definitions.store'

export interface CreatePlantFormProps {
    plantDefinitions: PlantDefinitionRow[]
    onCreated?: (newPlantId: number) => void
}

export default function CreatePlantForm({ plantDefinitions, onCreated }: CreatePlantFormProps) {
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

            <div>
                <label htmlFor="plantDefinitionId">Tipo de planta</label>
                <select
                    id="plantDefinitionId"
                    name="plantDefinitionId"
                    disabled={isPending}
                    required
                    aria-invalid={fieldError === 'plantDefinitionId'}
                >
                    <option value="">Selecciona un tipo...</option>
                    {plantDefinitions.map((def) => (
                        <option key={def.id} value={def.id}>
                            {def.commonName} ({def.scientificName})
                        </option>
                    ))}
                </select>
                {plantDefinitions.length === 0 && (
                    <small>
                        No hay tipos de plantas. <a href="/plant-definitions">Crea uno primero</a>.
                    </small>
                )}
            </div>

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
                <button type="submit" disabled={isPending || plantDefinitions.length === 0}>
                    {isPending ? 'Guardando...' : 'Guardar'}
                </button>
                <button type="reset" disabled={isPending}>
                    Limpiar
                </button>
            </div>
        </form>
    )
}
