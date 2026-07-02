import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  [
    'inline-block',
    'text-center',
    'rounded-md',
    'cursor-pointer',
    'content-center',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-primary-default',
        secondary:
          'disabled:bg-secondary-subtle disabled:text-secondary-dark bg-secondary-default text-secondary-dark',
        tertiary: 'border-primary-default/40 bg-primary-default/10',
        danger: 'bg-danger-default text-white',
        clean: 'bg-primary-default/10',
      },
      size: {
        md: ['leading-0', 'border-2', 'h-8', 'min-w-24', 'px-3', 'py-1'],
        sm: ['text-sm', 'p-1'],
      },
    },

    defaultVariants: { size: 'md' },
    compoundVariants: [
      {
        variant: ['primary', 'secondary', 'danger', 'clean'],
        className: 'border-transparent',
      },
    ],
  }
)
