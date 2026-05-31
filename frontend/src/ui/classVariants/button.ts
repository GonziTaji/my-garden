import { cva } from "class-variance-authority";

export const buttonVariants = cva([
  "inline-block",
  "text-center",
  "rounded-md",
  "cursor-pointer",
  "content-center",
], {
  variants: {
    variant: {
      primary: 'bg-rose-200',
      secondary: 'bg-olive-200 text-olive-600',
      tertiary: 'border-rose-200/40 bg-rose-200/10',
      danger: 'bg-red-400 text-white',
      clean: 'bg-rose-200/10',
    },
    size: {
      md: [
        "leading-0",
        "border-2",
        "h-8",
        "min-w-24",
        "px-3",
        "py-1",
      ], sm: [
        "text-sm",
        "p-1",
      ]
    }
  },

  defaultVariants: { size: "md" },
  compoundVariants: [{
    variant: ['primary', 'secondary', "danger", "clean"],
    className: 'border-transparent',
  }]
})
