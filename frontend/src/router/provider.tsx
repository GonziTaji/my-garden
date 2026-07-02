import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  type ComponentType,
} from 'react'
import type { routerPaths, RouterPath } from './routes'

interface RouterState {
  path: string
  params: Record<string, string>
  searchParams: URLSearchParams
}

interface NavigateConfig {
  params?: Record<string, string>
  search?: Record<string, string>
}

interface RouterContextValue extends RouterState {
  navigate: (to: RouterPath, config?: NavigateConfig) => void
}

const RouterContext = createContext<RouterContextValue | null>(null)

function matchPath(
  pattern: string,
  pathname: string
): Record<string, string> | null {
  const patternParts = pattern.split('/')
  const pathParts = pathname.split('/')

  if (patternParts.length !== pathParts.length) return null

  const params: Record<string, string> = {}

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i])
    } else if (patternParts[i] !== pathParts[i]) {
      return null
    }
  }
  return params
}

export function RouterProvider({
  routes,
  layout: Layout,
  notFound: NotFound,
}: {
  routes: typeof routerPaths
  layout: ComponentType<{ children: ReactNode }>
  notFound: ComponentType
}) {
  const [currentLocation, setCurrentLocation] = useState(
    () => window.location.pathname + window.location.search
  )

  useEffect(() => {
    const onPop = () =>
      setCurrentLocation(window.location.pathname + window.location.search)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((to: RouterPath, config?: NavigateConfig) => {
    let href = to as string

    if (config?.params) {
      for (const [key, val] of Object.entries(config.params)) {
        href = href.replace(`:${key}`, encodeURIComponent(val))
      }
    }

    if (config?.search) {
      const sp = new URLSearchParams()
      for (const [k, v] of Object.entries(config.search)) {
        if (v) sp.set(k, v)
      }
      const qs = sp.toString()
      if (qs) href += `?${qs}`
    }

    window.history.pushState({}, '', href)
    setCurrentLocation(href)
  }, [])

  const currentPath = currentLocation.split('?')[0]
  const searchString = currentLocation.split('?').slice(1).join('?')
  const searchParams = new URLSearchParams(searchString)

  const matched = routes.find((r) => matchPath(r.path, currentPath) !== null)
  const params = matched ? matchPath(matched.path, currentPath) || {} : {}
  const PageComponent = matched ? matched.component : NotFound

  const contextValue: RouterContextValue = {
    path: currentPath,
    params,
    searchParams,
    navigate,
  }

  return (
    <RouterContext value={contextValue}>
      <Layout>
        <PageComponent />
      </Layout>
    </RouterContext>
  )
}

export function useRouter() {
  const ctx = useContext(RouterContext)
  if (!ctx) throw new Error('useRouter must be used inside RouterProvider')
  return ctx
}

export function useNavigate() {
  return useRouter().navigate
}

export function useParams() {
  return useRouter().params
}

export function useSearchParams() {
  const router = useRouter()

  const setSearchParams = useCallback(
    (params: Record<string, string>) => {
      const sp = new URLSearchParams()

      for (const [k, v] of Object.entries(params)) {
        if (v) sp.set(k, v)
      }

      const qs = sp.toString()
      const newPath = router.path + (qs ? `?${qs}` : '')

      window.history.pushState({}, '', newPath)
      window.dispatchEvent(new PopStateEvent('popstate'))
    },
    [router.path]
  )

  return [router.searchParams, setSearchParams] as const
}
