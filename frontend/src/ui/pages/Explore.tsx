import { Link } from "@/router/components/Link"
import { cva } from "class-variance-authority"

const linkVariants = cva([
  "h-20",
  "inline-block",
  "content-center",
  "cursor-pointer",
  "text-center",
  "text-xl",
  "font-bold",
  "rounded-xl",
  "text-olive-500 active:text-white",
  "bg-rose-100 active:bg-rose-200",
  "border-4",
  "border-rose-200",
])

export default function Home() {
  return (
    <div>
      hola
    </div>
  )
}
