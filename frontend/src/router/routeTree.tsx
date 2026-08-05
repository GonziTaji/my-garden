import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router'
import Layout from '@/ui/shared/pages/Layout'
import Home from '@/ui/plant-species/pages/Explore'
import PlantsListPage from '@/ui/plants/pages/PlantsList'
import PlantDetailPage from '@/ui/plants/pages/PlantDetail'
import CatalogList from '@/ui/plant-species/pages/CatalogList'
import CatalogNew from '@/ui/plant-species/pages/CatalogNew'
import CatalogDetail from '@/ui/plant-species/pages/CatalogDetail'
import CatalogNewPlant from '@/ui/plant-species/pages/CatalogNewPlant'
import Login from '@/ui/users/pages/Login'
import NewPlantPage from '@/ui/plants/pages/NewPlantPage'
import EditPlantPage from '@/ui/plants/pages/EditPlantPage'

function NotFound() {
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold text-secondary-dark">404</h2>
      <p className="text-secondary-strong mt-2">Pagina no encontrada</p>
    </div>
  )
}

interface PlantsListSearch {
  t?: 'list' | 'water' | 'history'
}

interface CatalogListSearch {
  t?: 'mine' | 'favorites' | 'linked' | 'all'
}

interface PlantFormSearch {
  plantSpeciesId?: number
}

export type CatalogNewSearch =
  | {
      fromPlantForm: boolean
      clonedFrom?: never
    }
  | {
      fromPlantForm?: never
      clonedFrom: number
    }

interface CatalogDetailSearch {
  e?: string
}

const rootRoute = createRootRoute({
  component: Layout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
})

const plantsListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/plants',
  validateSearch: (search: Record<string, unknown>): PlantsListSearch => ({
    t: (search.t as PlantsListSearch['t']) || undefined,
  }),
  component: PlantsListPage,
})

const plantsNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/plants/new',
  validateSearch: (search: Record<string, unknown>): PlantFormSearch => ({
    plantSpeciesId: (search.plantSpeciesId as number) || undefined,
  }),
  component: NewPlantPage,
})

const plantDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/plants/$plantid',
  component: PlantDetailPage,
})

const plantEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/plants/$plantid/edit',
  validateSearch: (search: Record<string, unknown>): PlantFormSearch => ({
    plantSpeciesId: (search.plantSpeciesId as number) || undefined,
  }),
  component: EditPlantPage,
})

const catalogListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/catalog',
  validateSearch: (search: Record<string, unknown>): CatalogListSearch => ({
    t: (search.t as CatalogListSearch['t']) || undefined,
  }),
  component: CatalogList,
})

const catalogNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/catalog/new',
  validateSearch: (search: Record<string, unknown>): CatalogNewSearch => ({
    fromPlantForm: (search.fromPlantForm as boolean) || undefined,
    clonedFrom: (search.clonedFrom as number) || undefined,
  }),
  component: CatalogNew,
})

const catalogDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/catalog/$plantspeciesid',
  validateSearch: (search: Record<string, unknown>): CatalogDetailSearch => ({
    e: (search.e as string) || undefined,
  }),
  component: CatalogDetail,
})

const catalogNewPlantRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/catalog/$plantspeciesid/new-plant',
  component: CatalogNewPlant,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
})

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '$',
  component: NotFound,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  plantsListRoute,
  plantsNewRoute,
  plantDetailRoute,
  plantEditRoute,
  catalogListRoute,
  catalogNewRoute,
  catalogDetailRoute,
  catalogNewPlantRoute,
  loginRoute,
  notFoundRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
