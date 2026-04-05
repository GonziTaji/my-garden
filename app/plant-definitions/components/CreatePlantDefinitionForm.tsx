'use client'

import { createPlantDefinition, ActionResult } from '../actions'
import { useTransition, useState } from 'react'
import { waterProfile } from '@/domain/plants/water/water-profile'
import { lightLevel } from '@/domain/plants/light/light-level'
import { soilType } from '@/domain/plants/soil/soil-type'
import { plantCategory } from '@/domain/plants/category/plant-category'

export interface CreatePlantDefinitionFormProps {
    onCreated?: (newId: number) => void
}

export default function CreatePlantDefinitionForm({ onCreated }: CreatePlantDefinitionFormProps) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [fieldError, setFieldError] = useState<string | null>(null)

    function submit(fd: FormData) {
        setError(null)
        setFieldError(null)

        startTransition(async () => {
            const result: ActionResult = await createPlantDefinition(fd)

            if (result.success && result.id) {
                onCreated?.(result.id)
            } else if (result.error) {
                setError(result.error)
                setFieldError(result.field ?? null)
            }
        })
    }

    return (
        <form className="create-plant-definition-form" action={submit}>
            {error && (
                <div className="form-error" role="alert">
                    {error}
                </div>
            )}

            <div>
                <label htmlFor="commonName">Nombre comun</label>
                <input
                    id="commonName"
                    name="commonName"
                    type="text"
                    placeholder="Costilla de Adan"
                    minLength={1}
                    disabled={isPending}
                    required
                    aria-invalid={fieldError === 'commonName'}
                />
            </div>

            <div>
                <label htmlFor="scientificName">Nombre cientifico</label>
                <input
                    id="scientificName"
                    name="scientificName"
                    type="text"
                    placeholder="Monstera deliciosa"
                    minLength={1}
                    disabled={isPending}
                    required
                    aria-invalid={fieldError === 'scientificName'}
                />
            </div>

            <div>
                <label htmlFor="waterProfile">Perfil de agua</label>
                <select
                    id="waterProfile"
                    name="waterProfile"
                    disabled={isPending}
                    required
                    aria-invalid={fieldError === 'waterProfile'}
                >
                    <option value="">Selecciona...</option>
                    {waterProfile.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label htmlFor="lightLevel">Nivel de luz</label>
                <select
                    id="lightLevel"
                    name="lightLevel"
                    disabled={isPending}
                    required
                    aria-invalid={fieldError === 'lightLevel'}
                >
                    <option value="">Selecciona...</option>
                    {lightLevel.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label htmlFor="soilType">Tipo de suelo</label>
                <select
                    id="soilType"
                    name="soilType"
                    disabled={isPending}
                    required
                    aria-invalid={fieldError === 'soilType'}
                >
                    <option value="">Selecciona...</option>
                    {soilType.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            <fieldset>
                <legend>Categorias</legend>
                {plantCategory.options.map((opt) => (
                    <label key={opt.value} className="checkbox-label">
                        <input
                            type="checkbox"
                            name="categories"
                            value={opt.value}
                            disabled={isPending}
                        />
                        {opt.label}
                    </label>
                ))}
            </fieldset>

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
