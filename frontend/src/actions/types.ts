export type ActionResult<T = unknown> = T & {
  success?: boolean
  error?: string
}

