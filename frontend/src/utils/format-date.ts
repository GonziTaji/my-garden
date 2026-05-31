
export function toISODateString(base?: string | number | Date): string {
  let d: Date

  if (!base) {
    d = new Date()
  } else if (base instanceof Date) {
    d = base
  } else {
    d = new Date(base)
  }

  return d.toISOString().split("T")[0]
}
