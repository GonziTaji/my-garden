import { cva } from "class-variance-authority";

export const buttonVariants = cva(["text-center h-8 min-w-24", "px-3", "py-1", "rounded-md", "cursor-pointer"], {
    variants: {
        variant: {
            primary: 'bg-rose-200',
            secondary: 'bg-olive-300',
            danger: 'bg-red-400 text-white',
        }
    }
})
