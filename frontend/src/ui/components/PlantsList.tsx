import { usePlants } from '@/api/plants'
import {
  fullsearchPlants,
  type PlantWithSpecies,
} from '@/domain/plants/plant'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState, type ChangeEvent } from 'react'
import { buttonVariants } from '../classVariants/button'

type PlantsColumnsData = [PlantWithSpecies[], PlantWithSpecies[]]

export interface PlantsListProps {}

export default function PlantsList({}: PlantsListProps) {
  const { data: plants, isLoading, error } = usePlants()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpeciesId, setSelectedSpeciesId] = useState('')

  const navigate = useNavigate()

  const plantsColumns: PlantsColumnsData = fullsearchPlants(
    searchTerm,
    plants || []
  )
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
    ) || [[], []]

  const allSpecies = (plants || [])
    .flatMap((plant) => plant.species)
    .filter(
      (sp, i, arr) => arr.findIndex((other) => sp.id === other.id) === i
    )

  if (isLoading) return 'Obteniendo plantas...'
  if (error) return 'Error obteniendo plantas: ' + error.toString()

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
    <div className="">
      <div className="grid grid-cols-2 p-2 gap-4">
        <input
          type="search"
          onChange={handleSearchChange}
          placeholder="Buscar"
          className="border-b border-secondary-subtle"
        />

        <select
          onChange={handleSpeciesFilterChange}
          className="border-b border-secondary-subtle"
        >
          <option value="" className="">
            Todas
          </option>
          {Array.from(allSpecies).map((sp) => (
            <option key={sp.id} value={sp.id!} className="">
              {sp.commonName} - {sp.scientificName}
            </option>
          ))}
        </select>
      </div>

      <nav className="p-4 h-full grid grid-cols-2 gap-x-4">
        {plantsColumns?.map((col, i) => (
          <div key={i}>
            {col.map((p) => (
              <Link
                key={p.id}
                to="/plants/$plantid"
                params={{ plantid: String(p.id!) }}
                className="flex flex-col justify-end rounded py-2"
              >
                <div className="w-full overflow-hidden rounded-lg">
                  {p.images[0]?.filepath ? (
                    <img src={p.images[0]?.filepath} />
                  ) : (
                    <div className="w-full aspect-square flex items-center justify-center  bg-secondary-default">
                      <span>Sin imagen</span>
                    </div>
                  )}
                </div>

                <div className="p-2 grid items-baseline">
                  <span className="">{p.nickname}</span>
                  <span className="text-xs">{p.species.scientificName}</span>
                </div>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <button
        type="button"
        onClick={handleCreateClick}
        // disabled={}
        className={buttonVariants({
          variant: 'primary',
          size: 'sm',
          className: 'rounded-full! absolute bottom-0 right-0 m-4 w-12 h-12',
        })}
      >
        +
      </button>
    </div>
  )
}
