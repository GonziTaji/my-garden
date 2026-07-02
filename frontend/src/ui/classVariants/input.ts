import { cva } from 'class-variance-authority'

export const inputVariants = cva(
  [
    'transition-all',
    'p-1',
    'border',
    'outline-primary-strong',
    'border-primary-default',
  ],
  {
    variants: {
      field: {
        commonName: ['text-3xl', 'rounded-t-sm', 'border-b-0'],
        scientificName: ['italic', 'text-lg', 'rounded-b-sm', 'border-t-0'],
      },
      disabled: {
        true: ['border-transparent'],
      },
    },
  }
)
