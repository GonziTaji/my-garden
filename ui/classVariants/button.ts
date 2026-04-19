import { cva } from "class-variance-authority";

export const buttonVariants = cva([
    "inline-block",
    "text-center",
    "leading-0",
    "border-2",
    "h-8",
    "content-center",
    "min-w-24",
    "px-3",
    "py-1",
    "rounded-md",
    "cursor-pointer"
], {
    variants: {
        variant: {
            primary: 'bg-rose-200',
            secondary: 'bg-olive-200 text-olive-600',
            tertiary: 'border-rose-200/40 bg-rose-200/10',
            danger: 'bg-red-400 text-white',
        }
    },
    compoundVariants: [{
        variant: ['primary', 'secondary', "danger"],
        className: 'border-transparent',
    }]
})
