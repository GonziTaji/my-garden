import { Link } from '@/router/components/Link'
import { usePlants } from '@/api/plants'
import PlantCalendar from './PlantCalendar'
import { useState } from 'react'

interface WateringHistoryGridProps {
}

export default function WateringHistoryGrid({ }: WateringHistoryGridProps) {
  const { data: plants, isLoading } = usePlants()

  if (isLoading) return <>Cargando...</>

  if (!plants || plants.length === 0) {
    return (
      <p className="text-center py-8">
        <span>No hay plantas en tu jardin</span>
        <Link to="/plants/new" className="hover:underline ml-1">
          Agregar planta
        </Link>
      </p>
    )
  }

  return (
    <div className="px-2">
      <span className='text-center block text-2xl py-4'>Historial de riego</span>

      <div className='overflow-auto'>
        {plants.map((plant) => (
          <div className='grid grid-cols-[auto_1fr] gap-4' key={plant.nickname}>
            <div className='w-min'>
              <span>{plant.nickname}</span>
              <img src={plant.images[0]?.filepath} alt={plant.nickname} />
            </div>

            <div className='w-full'>
              <PlantCalendar plantId={plant.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

