import { cn } from '@sglara/cn'
import type { FC } from 'react'
import { cva } from 'class-variance-authority'
import type { PlantSpecies } from '@/domain/plants/plant-species'

const checkboxLabelVariants = cva(
  [
    'px-1',
    'content-center',
    'block',
    'w-full',
    'min-w-24',
    'min-h-12',
    'has-checked:border-primary-subtle',
    'not-[:has(:checked)]:border-secondary-subtle',
  ],
  {
    variants: {
      disabled: {
        true: 'has-checked:border-3',
        false: 'cursor-pointer border-3',
      },
    },
  }
)

interface DetailOption {
  value: string
  label: string
  selected: boolean
}

type DetailChecklistKey = keyof Pick<
  PlantSpecies,
  'categories' | 'waterProfile' | 'lightLevel' | 'soilType' | 'petToxicity'
>

type DetailChecklistType = 'radio' | 'checkbox'

export const DetailChecklist: FC<{
  className?: string
  name: DetailChecklistKey
  type: DetailChecklistType
  options: DetailOption[]
  disabled?: boolean
}> = ({ name, type, options, disabled, className }) => (
  <ul className={cn('flex flex-wrap gap-2 justify-center', className)}>
    {options.map((opt) => (
      <li key={opt.value}>
        <label className={checkboxLabelVariants({ disabled })}>
          <input
            className="hidden"
            name={name}
            type={type}
            defaultValue={opt.value}
            defaultChecked={opt.selected}
            disabled={disabled}
          />
          {opt.label}
        </label>
      </li>
    ))}
  </ul>
)
