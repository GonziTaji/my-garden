import { cn } from '@sglara/cn'
import type { PropsWithChildren } from 'react'

interface DetailListItemProps {
  title: string
}

export default function DetailListItem({
  title,
  children,
}: PropsWithChildren<DetailListItemProps>) {
  return (
    <>
      <dt
        className={cn(
          'text-base font-semibold text-neutral-dark flex gap-4 items-center text-center',
          'after:flex-1 after:h-px after:bg-neutral-subtle/40',
          'before:flex-1 before:h-px before:bg-neutral-subtle/40'
        )}
      >
        {title}
      </dt>
      <dd className="text-center my-1 pb-3">{children}</dd>
    </>
  )
}
