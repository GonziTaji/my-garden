import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  [
    'inline-block',
    'text-center',
    'rounded-xl',
    'cursor-pointer',
    'content-center',
    'font-medium',
    'transition-all',
    'duration-200',
    'ease-out',
    'active:scale-[0.97]',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-primary-strong text-white shadow-sm shadow-primary-strong/30 hover:bg-primary-dark hover:shadow-md hover:shadow-primary-dark/30',
        secondary:
          'bg-surface-raised text-neutral-dark border border-neutral-subtle/60 shadow-sm hover:bg-primary-light hover:border-primary-default hover:shadow-md',
        tertiary:
          'bg-primary-subtle/50 text-primary-dark border border-primary-default/40 hover:bg-primary-subtle hover:border-primary-strong/50',
        danger:
          'bg-danger-strong text-white shadow-sm shadow-danger-strong/30 hover:bg-danger-dark hover:shadow-md',
        clean: 'bg-transparent text-primary-dark hover:bg-primary-subtle/60',
      },
      size: {
        md: ['leading-0', 'h-10', 'min-w-28', 'px-5', 'py-2'],
        sm: ['text-sm', 'h-8', 'px-3', 'py-1'],
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
