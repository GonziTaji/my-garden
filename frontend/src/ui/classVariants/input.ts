import { cva } from "class-variance-authority";

export const inputVariants = cva([
  "transition-all",
  "p-1",
  "border",
  "outline-rose-400",
  "border-rose-200",
], {
  variants: {
    field: {
      commonName: ["text-3xl", "rounded-t-sm", "border-b-0"],
      scientificName: ["italic", "text-lg", "rounded-b-sm", "border-t-0"],
    },
    disabled: {
      true: ["border-transparent"],
    },
  },
})
