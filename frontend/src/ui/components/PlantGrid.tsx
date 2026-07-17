import { usePlants } from '@/api/plants'
import { fullsearchPlants, type PlantWithSpecies } from '@/domain/plants/plant'
import { Link, useNavigate } from '@tanstack/react-router'
import { useMemo, useState, type ChangeEvent } from 'react'
import { buttonVariants } from '../classVariants/button'
import { QueryState } from './QueryState'

type PlantsColumnsData = [PlantWithSpecies[], PlantWithSpecies[]]

export default function PlantsList() {
  const { data: plants, isLoading, error } = usePlants()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpeciesId, setSelectedSpeciesId] = useState('')

  const navigate = useNavigate()

  const plantsColumns: PlantsColumnsData = useMemo(
    () =>
      fullsearchPlants(searchTerm, plants || [])
        .filter((plant) => {
          if (!selectedSpeciesId) return true
          return String(plant.species.id) === selectedSpeciesId
        })
        .reduce(
          (cols, plant, i) => {
            cols[i % 2].push(plant)
            return cols
          },
          [[], []] as PlantsColumnsData
        ) || [[], []],
    [searchTerm, plants, selectedSpeciesId]
  )

  const allSpecies = useMemo(
    () =>
      (plants || [])
        .flatMap((plant) => plant.species)
        .filter((sp, i, arr) => arr.findIndex((other) => sp.id === other.id) === i),
    [plants]
  )

  function handleSearchChange(ev: ChangeEvent<HTMLInputElement>) {
    setSearchTerm(ev.currentTarget.value)
  }

  function handleSpeciesFilterChange(ev: ChangeEvent<HTMLSelectElement>) {
    setSelectedSpeciesId(ev.currentTarget.value)
  }

  function handleCreateClick() {
    navigate({ to: '/plants/new' })
  }

  return (
    <QueryState isLoading={isLoading} error={error} loadingText="Obteniendo plantas...">
    <div className="relative">
      <div className="grid grid-cols-2 p-4 gap-3">
        <input
          type="search"
          onChange={handleSearchChange}
          placeholder="Buscar"
          className="border border-neutral-subtle/60 rounded-lg px-3 py-2 bg-surface-raised text-sm focus:outline-none focus:border-primary-strong focus:ring-2 focus:ring-primary-subtle transition-all"
        />

        <select
          onChange={handleSpeciesFilterChange}
          className="border border-neutral-subtle/60 rounded-lg px-3 py-2 bg-surface-raised text-sm focus:outline-none focus:border-primary-strong focus:ring-2 focus:ring-primary-subtle transition-all"
        >
          <option value="">Todas</option>
          {Array.from(allSpecies).map((sp) => (
            <option key={sp.id} value={sp.id!}>
              {sp.commonName} - {sp.scientificName}
            </option>
          ))}
        </select>
      </div>

      <nav className="px-4 pb-20 h-full grid grid-cols-2 gap-x-3">
        {plantsColumns?.map((col, i) => (
          <div key={i} className="flex flex-col gap-3">
            {col.map((p) => (
              <Link
                key={p.id}
                to="/plants/$plantid"
                params={{ plantid: String(p.id!) }}
                className="flex flex-col rounded-xl overflow-hidden bg-surface-raised shadow-sm hover:shadow-md transition-all duration-200 border border-neutral-subtle/30 group"
              >
                <div className="w-full overflow-hidden">
                  {p.images[0]?.filepath ? (
                    <img
                      src={p.images[0]?.filepath}
                      className="w-full aspect-square object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full aspect-square flex items-center justify-center bg-primary-light text-sm text-neutral-default">
                      Sin imagen
                    </div>
                  )}
                </div>

                <div className="p-2.5">
                  <span className="font-medium text-neutral-dark block">{p.nickname}</span>
                  <span className="text-xs text-neutral-strong italic">
                    {p.species.scientificName}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <button
        type="button"
        onClick={handleCreateClick}
        className={buttonVariants({
          variant: 'primary',
          size: 'sm',
          className:
            'rounded-full! fixed bottom-6 right-6 w-14 h-14 text-xl shadow-lg shadow-primary-strong/40 hover:shadow-xl hover:shadow-primary-strong/50 z-10',
        })}
      >
        +
      </button>
    </div>
    </QueryState>
  )
}
