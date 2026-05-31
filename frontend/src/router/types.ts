import type { ComponentType } from "react"
import type { RouterPath } from "./routes"

export interface RouteConfig {
  path: RouterPath
  component: ComponentType
}
