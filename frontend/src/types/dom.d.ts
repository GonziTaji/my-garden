import "react"

declare module "react" {
  interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    command?: string
    commandfor?: string
    formmethod?: string
  }
}
