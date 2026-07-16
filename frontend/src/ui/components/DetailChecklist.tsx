import { cn } from '@sglara/cn'
import type { FC } from 'react'
import { cva } from 'class-variance-authority'
import type { PlantSpecies } from '@/domain/plants/plant-species'

const checkboxLabelVariants = cva(
  [
    'px-3',
    'py-2',
    'content-center',
    'block',
    'w-full',
    'min-w-24',
    'min-h-12',
    'rounded-lg',
    'text-sm',
    'font-medium',
    'transition-all',
    'duration-200',
    'has-checked:bg-primary-subtle has-checked:text-primary-dark has-checked:border-primary-strong has-checked:border-2',
    'not-[:has(:checked)]:border not-[:has(:checked)]:border-neutral-subtle/60 not-[:has(:checked)]:bg-surface-raised not-[:has(:checked)]:text-neutral-strong',
  ],
  {
    variants: {
      disabled: {
        true: 'has-checked:border-2 has-checked:bg-primary-light',
        false: 'cursor-pointer hover:border-primary-default hover:bg-primary-light/50',
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
