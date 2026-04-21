'use client'

import { PlantWithDefinition } from '@/db/stores/plants.store'
import { useState } from 'react'

interface GroupData {
    plants: PlantWithDefinition[]
    definition: PlantWithDefinition['plantDefinition']
}

interface WateringListProps {
    groups: Record<string, GroupData>
    lastWateredDates?: Map<number, string>
}

export default function WateringList({ groups, lastWateredDates = new Map() }: WateringListProps) {
    const [selected, setSelected] = useState<Set<number>>(new Set())

    const toggle = (plantId: number) => {
        const next = new Set(selected)
        if (next.has(plantId)) {
            next.delete(plantId)
        } else {
            next.add(plantId)
        }
        setSelected(next)
    }

    const toggleAllInGroup = (groupPlants: PlantWithDefinition[]) => {
        const allSelected = groupPlants.every((p) => selected.has(p.id))
        const next = new Set(selected)

        if (allSelected) {
            for (const p of groupPlants) {
                next.delete(p.id)
            }
        } else {
            for (const p of groupPlants) {
                next.add(p.id)
            }
        }
        setSelected(next)
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return 'Hoy'
        if (diffDays === 1) return 'Ayer'
        if (diffDays < 7) return `Hace ${diffDays} días`
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    }

    return (
        <div className="grid gap-4">
            <input type="hidden" name="plantIds" value={JSON.stringify([...selected])} />

            {Object.values(groups).map(({ definition, plants }) => {
                const allSelected = plants.every((p) => selected.has(p.id))
                const someSelected = plants.some((p) => selected.has(p.id))

                return (
                    <div key={definition.id} className="border-2 rounded-md border-amber-200/20 bg-amber-100/20 p-4">
                        <div className="flex items-center gap-3 border-b border-olive-600/20 pb-2 mb-2">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                ref={(el) => {
                                    if (el) el.indeterminate = someSelected && !allSelected
                                }}
                                onChange={() => toggleAllInGroup(plants)}
                                className="w-5 h-5"
                            />
                            <div>
                                <span className="text-xl block">{definition.commonName}</span>
                                <span className="text-sm italic block opacity-70">{definition.scientificName}</span>
                            </div>
                        </div>

                        <ul className="grid gap-2 ps-8">
                            {plants.map((p) => {
                                const lastWatered = lastWateredDates.get(p.id)
                                const isSelected = selected.has(p.id)

                                return (
                                    <li key={p.id} className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggle(p.id)}
                                            className="w-4 h-4"
                                        />
                                        <label className="flex-1 flex items-center justify-between cursor-pointer">
                                            <span>{p.nickname}</span>
                                            {lastWatered && (
                                                <span className="text-sm opacity-50">
                                                    {formatDate(lastWatered)}
                                                </span>
                                            )}
                                        </label>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                )
            })}
        </div>
    )
}

export function getSelectedPlantIds(formData: FormData): number[] {
    const plantIdsJson = formData.get('plantIds')?.toString() ?? '[]'
    try {
        return JSON.parse(plantIdsJson) as number[]
    } catch {
        return []
    }
}