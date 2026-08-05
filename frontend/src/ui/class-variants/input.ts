import { cva } from 'class-variance-authority'

export const inputVariants = cva(
  [
    'transition-all',
    'duration-200',
    'p-2',
    'border',
    'border-neutral-subtle/60',
    'rounded-lg',
    'bg-surface-raised',
    'text-neutral-dark',
    'placeholder:text-neutral-default',
    'focus:outline-none',
    'focus:border-primary-strong',
    'focus:ring-2',
    'focus:ring-primary-subtle',
    'hover:border-neutral-default',
  ],
  {
    variants: {
      field: {
        commonName: ['text-3xl', 'rounded-t-lg', 'border-b-0', 'font-semibold'],
        scientificName: ['italic', 'text-lg', 'rounded-b-lg', 'border-t-0', 'text-neutral-strong'],
      },
      disabled: {
        true: ['border-transparent', 'bg-transparent', 'hover:border-transparent'],
      },
    },
  }
)
