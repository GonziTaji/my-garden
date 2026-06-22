import ReactDOM from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "./router/provider"
import Layout from "./ui/pages/Layout"
import { routerPaths } from "./router/routes"

const queryClient = new QueryClient()

function NotFound() {
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold text-olive-700">404</h2>
      <p className="text-olive-500 mt-2">Página no encontrada</p>
    </div>
  )
}

const rootElement = document.getElementById("app")!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider routes={routerPaths} layout={Layout} notFound={NotFound} />
    </QueryClientProvider>,
  )
}
