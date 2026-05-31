import { cn } from "@sglara/cn"
import type { PropsWithChildren } from "react"

interface DetailListItemProps {
  title: string
}

export default function DetailListItem({ title, children }: PropsWithChildren<DetailListItemProps>) {
  return (
    <>
      <dt className={cn(
        "text-lg flex gap-4 items-center text-center",
        "after:flex-1 after:h-px after:bg-olive-400",
        "before:flex-1 before:h-px before:bg-olive-400",
      )}>
        {title}
      </dt>
      <dd className='text-center my-2 pb-4'>
        {children}
      </dd>
    </>
  )
}
