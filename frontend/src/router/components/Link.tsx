import { type MouseEvent, type ReactNode } from "react"
import { useNavigate } from "../provider"
import type { RouterPath } from "../routes"

export function Link({
  to,
  params,
  search,
  children,
  className,
}: {
  to: RouterPath
  params?: Record<string, string>
  search?: Record<string, string>
  children: ReactNode
  className?: string
}) {
  const navigate = useNavigate()
  const auxNavigate = () => navigate(to, { params, search })

  let href = to as string

  if (params) {
    for (const [key, val] of Object.entries(params)) {
      href = href.replace(`:${key}`, encodeURIComponent(val))
    }
  }

  if (search) {
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries(search)) {
      if (v) sp.set(k, v)
    }
    const qs = sp.toString()
    if (qs) href += `?${qs}`
  }

  const handleClick = (e: MouseEvent) => {
    if (e.button !== 0) return
    if (e.metaKey || e.ctrlKey) return
    e.preventDefault()
    auxNavigate()
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  )
}
