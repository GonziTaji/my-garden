'use client'

import { toggleWatering } from '@/actions/plant.actions'
import { useTransition } from 'react'

interface WateringGridCellProps {
  plantId: number
  date: string
  isWatered: boolean
}

export default function WateringGridCell({ plantId, date, isWatered }: WateringGridCellProps) {
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      await toggleWatering(plantId, date)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`
                w-10 h-10 rounded border-2 transition-colors
                ${isWatered
          ? 'bg-blue-500 border-blue-600 hover:bg-blue-600'
          : 'bg-white border-gray-200 hover:border-blue-300'
        }
                ${isPending ? 'opacity-50' : ''}
            `}
      title={`${isWatered ? 'Deshacer' : 'Registrar'} riego - ${date}`}
    >
      {isWatered && (
        <svg className="w-6 h-6 text-white mx-auto" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  )
}
