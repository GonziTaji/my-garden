import 'react'

declare module 'react' {
  interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    command?: string
    commandfor?: string
    formmethod?: string
  }

  namespace JSX {
    interface IntrinsicElements {
      selectedcontent: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
    }
  }
}
