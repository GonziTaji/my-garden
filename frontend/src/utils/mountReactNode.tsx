import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'

/**
 * Mounts the provided node in the selector
 *
 * @throws {Error} if no element is found with the selector
 */
export default function mountReactNode(selector: string, node: ReactNode) {
  const root = document.querySelector(selector)

  if (!root) {
    throw new Error(`Can't create react root with selector "${selector}": Element not found`)
  }

  createRoot(root).render(
    <StrictMode>
      {node}
    </StrictMode>
  )
}

