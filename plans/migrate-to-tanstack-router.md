# Migration Plan: React Router → TanStack Router

## Context

The frontend currently uses React Router v8 (`react-router` package) with `createBrowserRouter` for SPA routing. All data fetching is handled via TanStack React Query — no route loaders or actions are used. The migration switches to TanStack Router (`@tanstack/react-router`) for type-safe routing that integrates naturally with the existing TanStack stack.

## Scope

- **20 files** import from `react-router` — all must be updated
- **12 routes** defined in `src/router/router.tsx`
- No route loaders/actions to port (data fetching stays in React Query)
- Root `Layout` wraps all routes via `<Outlet />`

---

## Step 1: Install / Uninstall packages

```bash
cd frontend
npm uninstall react-router
npm install @tanstack/react-router
npm install -D @tanstack/router-devtools   # optional, for dev
```

---

## Step 2: Create typed route tree

Create `src/router/routeTree.tsx` — the single source of truth for all routes, with full TypeScript types for params and search.

**File: `src/router/routeTree.tsx`** (new)

```tsx
import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  redirect,
} from '@tanstack/react-router'

import Layout from '@/ui/pages/Layout'
import Home from '@/ui/pages/Explore'
import PlantsListPage from '@/ui/pages/PlantsList'
import PlantFormPage from '@/ui/pages/PlantFormPage'
import PlantDetailPage from '@/ui/pages/PlantDetail'
import CatalogList from '@/ui/pages/CatalogList'
import CatalogNew from '@/ui/pages/CatalogNew'
import CatalogDetail from '@/ui/pages/CatalogDetail'
import CatalogNewPlant from '@/ui/pages/CatalogNewPlant'
import Login from '@/ui/pages/Login'
import { Sbx } from '@/ui/pages/Sbx'

// --- Search param schemas (Zod or manual) ---
// Using manual for now to avoid adding a dependency.
// Define search types for routes that use ?search params.

interface PlantsListSearch {
  t?: 'list' | 'water' | 'history'
}

interface CatalogListSearch {
  t?: 'mine' | 'favorites' | 'linked' | 'all'
}

interface PlantFormSearch {
  plant_species_id?: string
}

interface CatalogDetailSearch {
  e?: string
}

// --- Root route (Layout) ---
const rootRoute = createRootRoute({
  component: Layout,
})

// --- Index route: / ---
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
})

// --- /plants ---
const plantsListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/plants',
  validateSearch: (search: Record<string, unknown>): PlantsListSearch => ({
    t: (search.t as PlantsListSearch['t']) || undefined,
  }),
  component: PlantsListPage,
})

// --- /plants/new ---
const plantsNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/plants/new',
  validateSearch: (search: Record<string, unknown>): PlantFormSearch => ({
    plant_species_id: (search.plant_species_id as string) || undefined,
  }),
  component: PlantFormPage,
})

// --- /plants/$plantid ---
interface PlantDetailParams {
  plantid: string
}
const plantDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/plants/$plantid',
  parseParams: (params: Record<string, string>): PlantDetailParams => ({
    plantid: params.plantid,
  }),
  component: PlantDetailPage,
})

// --- /plants/$plantid/edit ---
const plantEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/plants/$plantid/edit',
  parseParams: (params: Record<string, string>): PlantDetailParams => ({
    plantid: params.plantid,
  }),
  validateSearch: (search: Record<string, unknown>): PlantFormSearch => ({
    plant_species_id: (search.plant_species_id as string) || undefined,
  }),
  component: PlantFormPage,
})

// --- /catalog ---
const catalogListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/catalog',
  validateSearch: (search: Record<string, unknown>): CatalogListSearch => ({
    t: (search.t as CatalogListSearch['t']) || undefined,
  }),
  component: CatalogList,
})

// --- /catalog/new ---
const catalogNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/catalog/new',
  component: CatalogNew,
})

// --- /catalog/$plantspeciesid ---
interface CatalogDetailParams {
  plantspeciesid: string
}
const catalogDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/catalog/$plantspeciesid',
  parseParams: (params: Record<string, string>): CatalogDetailParams => ({
    plantspeciesid: params.plantspeciesid,
  }),
  validateSearch: (search: Record<string, unknown>): CatalogDetailSearch => ({
    e: (search.e as string) || undefined,
  }),
  component: CatalogDetail,
})

// --- /catalog/$plantspeciesid/new-plant ---
const catalogNewPlantRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/catalog/$plantspeciesid/new-plant',
  parseParams: (params: Record<string, string>): CatalogDetailParams => ({
    plantspeciesid: params.plantspeciesid,
  }),
  component: CatalogNewPlant,
})

// --- /login ---
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
})

// --- /sbx ---
const sbxRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sbx',
  component: Sbx,
})

// --- 404 catch-all ---
const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '$',
  component: NotFound,
})

function NotFound() {
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold text-secondary-dark">404</h2>
      <p className="text-secondary-strong mt-2">Pagina no encontrada</p>
    </div>
  )
}

// --- Build route tree ---
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
  sbxRoute,
  notFoundRoute,
])

export const router = createRouter({ routeTree })

// Type-safe router for hooks
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
```

---

## Step 3: Update entry point

**File: `src/main.tsx`**

```diff
- import { RouterProvider } from 'react-router'
+ import { RouterProvider } from '@tanstack/react-router'
- import { router } from './router/router'
+ import { router } from './router/routeTree'
```

---

## Step 4: Update each page/component

### Hook & component API mapping

| React Router | TanStack Router |
|---|---|
| `import { Link } from 'react-router'` | `import { Link } from '@tanstack/react-router'` |
| `import { NavLink } from 'react-router'` | `import { Link } from '@tanstack/react-router'` (use `activeProps`) |
| `import { Outlet } from 'react-router'` | `import { Outlet } from '@tanstack/react-router'` |
| `import { useNavigate } from 'react-router'` | `import { useNavigate } from '@tanstack/react-router'` |
| `import { useParams } from 'react-router'` | `import { useParams } from '@tanstack/react-router'` |
| `import { useSearchParams } from 'react-router'` | `import { useSearch, useNavigate } from '@tanstack/react-router'` |
| `<Link to="/path">` | `<Link to="/path">` (same) |
| `<NavLink to="/" end className={({isActive}) => ...}>` | `<Link to="/" activeOptions={{ exact: true }} activeProps={{ className: ... }}>` |
| `navigate('/path')` | `navigate({ to: '/path' })` |
| `useParams()` → `{ plantid }` | `useParams({ from: '/plants/$plantid' })` → `{ plantid: string }` (typed) |
| `useSearchParams()` → `[sp, setSp]` | `useSearch({ from: route })` + `useNavigate` with `search` option |
| `<Link to="back">` | `history.back()` or `<Link onClick={(e) => { e.preventDefault(); history.back() }}>` |

### Per-file changes

#### `src/ui/pages/Layout.tsx`
```diff
- import { NavLink, Outlet } from 'react-router'
+ import { Link, Outlet } from '@tanstack/react-router'

- <NavLink to="/" end className={({isActive}) => cn('...', isActive && 'font-bold')}>
+ <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: cn('...', 'font-bold') }} className="text-secondary-dark hover:text-secondary-strong">

- <NavLink to="/plants" className={({isActive}) => cn('...', isActive && 'font-bold')}>
+ <Link to="/plants" activeProps={{ className: cn('...', 'font-bold') }} className="text-secondary-dark hover:text-secondary-strong">

// (same pattern for /catalog and /login NavLinks)
```

#### `src/ui/pages/PlantDetail.tsx`
```diff
- import { useNavigate, useParams } from 'react-router'
+ import { useNavigate, useParams } from '@tanstack/react-router'

- const { plantid: plantidParam } = useParams()
- const navigate = useNavigate()
+ const { plantid: plantidParam } = useParams({ from: plantDetailRoute })
+ const navigate = useNavigate()

- onClick={() => navigate('/plants')}
+ onClick={() => navigate({ to: '/plants' })}
```

#### `src/ui/pages/PlantFormPage.tsx`
```diff
- import { useParams, useSearchParams } from 'react-router'
+ import { useParams, useSearch, useNavigate } from '@tanstack/react-router'

- const [searchParams] = useSearchParams()
- const { plantid } = useParams()
+ const searchParams = useSearch({ from: plantEditRoute })
+ // For /plants/new route, params are empty; for /plants/$plantid/edit, params have plantid
+ // Use conditional based on whether plantid exists in the URL
+ // Since both /plants/new and /plants/$plantid/edit use this component,
+ // the component should handle both cases.
+ // With TanStack Router, these are separate routes pointing to the same component.
```

**Important**: `PlantFormPage` is used by both `/plants/new` (no params) and `/plants/$plantid/edit` (has `plantid`). In TanStack Router these are separate route definitions sharing the same component. The component needs to handle both cases. We can check if `plantid` param exists:

```tsx
import { useParams, useSearch, useNavigate } from '@tanstack/react-router'
import { plantDetailRoute, plantEditRoute } from '@/router/routeTree'

export default function PlantFormPage() {
  // This component is rendered by two different routes.
  // We need to handle both param styles.
  // Option: use useMatch to detect which route we're on,
  // or use the less-typed approach with useMatchSet.
  
  // Simplest: use router context
  const navigate = useNavigate()
  
  // For plant edit: get plantid from params
  // For plant new: no plantid
  // We can try to get params and handle missing gracefully
  const { plantid } = useParams({ strict: false }) as { plantid?: string }
  const searchParams = useSearch({ strict: false }) as { plant_species_id?: string }
  
  // ... rest of component
}
```

> **Note**: TanStack Router's `useParams({ strict: false })` allows reading params even when the exact route type isn't known. Alternatively, each route can pass data via `context` or `loaderData`.

#### `src/ui/pages/PlantsList.tsx`
```diff
- import { useSearchParams } from 'react-router'
+ import { useSearch, useNavigate } from '@tanstack/react-router'

- const [searchParams, setSearchParams] = useSearchParams()
- const tab = searchParams.get('t') || 'list'
+ const { t: tab = 'list' } = useSearch({ from: plantsListRoute })
+ const navigate = useNavigate()

- function handleTabChange(newTab: Tab) {
-   setSearchParams({ t: newTab })
- }
+ function handleTabChange(newTab: Tab) {
+   navigate({ search: { t: newTab } })
+ }
```

#### `src/ui/pages/CatalogList.tsx`
```diff
- import { Link, useSearchParams } from 'react-router'
+ import { Link, useSearch, useNavigate } from '@tanstack/react-router'

- const [searchParams, setSearchParams] = useSearchParams()
- const tab = (searchParams.get('t') as Tab) || 'all'
+ const { t: tab = 'all' } = useSearch({ from: catalogListRoute })
+ const navigate = useNavigate()

- onClick={() => setSearchParams({ t: t.key === 'all' ? '' : t.key })}
+ onClick={() => navigate({ search: { t: t.key === 'all' ? undefined : t.key } })}
```

#### `src/ui/pages/CatalogDetail.tsx`
```diff
- import { useParams, useSearchParams, useNavigate } from 'react-router'
+ import { useParams, useSearch, useNavigate } from '@tanstack/react-router'

- const { plantspeciesid: plantspeciesidParam } = useParams()
- const [searchParams] = useSearchParams()
- const navigate = useNavigate()
+ const { plantspeciesid: plantspeciesidParam } = useParams({ from: catalogDetailRoute })
+ const { e } = useSearch({ from: catalogDetailRoute })
+ const navigate = useNavigate()

- const editMode = searchParams.get('e') === 'T' && !species.deletedAt
+ const editMode = e === 'T' && !species.deletedAt

- onClick={() => navigate('/catalog')}
+ onClick={() => navigate({ to: '/catalog' })}
```

#### `src/ui/pages/CatalogNew.tsx`
```diff
- import { useSearchParams } from 'react-router'
+ import { useSearch } from '@tanstack/react-router'

- const [searchParams] = useSearchParams()
- const record = searchParams.has('commonName') ? speciesFromParams()! : emptySpecies
+ const searchParams = useSearch({ strict: false }) as Record<string, string>
+ const record = searchParams.commonName ? speciesFromParams(searchParams) : emptySpecies
```

> **Note**: `CatalogNew` uses `useSearchParams` but doesn't declare search params in the route. We use `strict: false` to access them, or we can define a search schema for the route.

#### `src/ui/pages/CatalogNewPlant.tsx`
```diff
- import { useParams } from 'react-router'
+ import { useParams } from '@tanstack/react-router'

- const { plantspeciesid: plantspeciesidParam } = useParams()
+ const { plantspeciesid: plantspeciesidParam } = useParams({ from: catalogNewPlantRoute })
```

#### `src/ui/pages/Login.tsx`
```diff
- import { useNavigate } from 'react-router'
+ import { useNavigate } from '@tanstack/react-router'

- navigate('/')
+ navigate({ to: '/' })
```

#### `src/ui/components/ExploreGrid.tsx`
```diff
- import { Link } from 'react-router'
+ import { Link } from '@tanstack/react-router'
// <Link to={...}> syntax is identical — no change needed
```

#### `src/ui/components/PlantDetails.tsx`
```diff
- import { Link, useNavigate } from 'react-router'
+ import { Link, useNavigate } from '@tanstack/react-router'

- onClick={() => navigate(`/plants/${plant.id}/edit`)}
+ onClick={() => navigate({ to: '/plants/$plantid/edit', params: { plantid: String(plant.id) } })}
```

#### `src/ui/components/WateringList.tsx`
```diff
- import { useNavigate } from 'react-router'
+ import { useNavigate } from '@tanstack/react-router'

- navigate(`/plants/${plantid}`)
+ navigate({ to: '/plants/$plantid', params: { plantid: String(plantid) } })
```

#### `src/ui/components/PlantForm.tsx`
```diff
- import { useNavigate, Link } from 'react-router'
+ import { useNavigate, Link } from '@tanstack/react-router'

- navigate(`/plants/${result.id}`)
+ navigate({ to: '/plants/$plantid', params: { plantid: String(result.id) } })
```

#### `src/ui/components/SpeciesCatalog.tsx`
```diff
- import { Link } from 'react-router'
+ import { Link } from '@tanstack/react-router'
// <Link to={...}> syntax is identical
```

#### `src/ui/components/PlantsList.tsx`
```diff
- import { Link, useNavigate } from 'react-router'
+ import { Link, useNavigate } from '@tanstack/react-router'

- navigate('/plants/new')
+ navigate({ to: '/plants/new' })
```

#### `src/ui/components/SpeciesView.tsx`
```diff
- import { Link, useNavigate } from 'react-router'
+ import { Link, useNavigate } from '@tanstack/react-router'

- navigate(`/catalog/${result.id}`)
+ navigate({ to: '/catalog/$plantspeciesid', params: { plantspeciesid: String(result.id) } })

- navigate(`/catalog/new?${sp}`)
+ navigate({ to: '/catalog/new', search: Object.fromEntries(sp) })

- navigate('/catalog')
+ navigate({ to: '/catalog' })

- <Link to="back" className={...}>
  // "back" is not supported in TanStack Router. Replace with:
+ <button type="button" className={...} onClick={() => history.back()}>
```

#### `src/ui/components/DeleteButton.tsx`
```diff
- import { useNavigate } from 'react-router'
+ import { useNavigate } from '@tanstack/react-router'

- navigate('/catalog')
+ navigate({ to: '/catalog' })
```

#### `src/ui/components/WateringHistoryGrid.tsx`
```diff
- import { Link } from 'react-router'
+ import { Link } from '@tanstack/react-router'
// <Link to="/plants/new"> syntax is identical
```

---

## Step 5: Delete old router file

Delete `src/router/router.tsx` (replaced by `src/router/routeTree.tsx`).

---

## Step 6: Verify

1. **Type check**: `npm run typecheck` (or `npx tsc --noEmit`)
2. **Lint**: `npm run lint`
3. **Dev server**: `npm run dev` — navigate all routes manually
4. **Search params**: Test tab switching on `/plants` and `/catalog`
5. **Back navigation**: Test `<Link to="back">` replacement in `SpeciesView.tsx`
6. **404**: Visit a non-existent route

---

## Files changed (summary)

| File | Action |
|---|---|
| `frontend/package.json` | Update deps |
| `frontend/src/router/routeTree.tsx` | **New** — typed route tree |
| `frontend/src/router/router.tsx` | **Delete** |
| `frontend/src/main.tsx` | Update import |
| `frontend/src/ui/pages/Layout.tsx` | NavLink → Link with activeProps |
| `frontend/src/ui/pages/PlantDetail.tsx` | Update hooks |
| `frontend/src/ui/pages/PlantFormPage.tsx` | Update hooks |
| `frontend/src/ui/pages/PlantsList.tsx` | useSearchParams → useSearch |
| `frontend/src/ui/pages/CatalogList.tsx` | useSearchParams → useSearch |
| `frontend/src/ui/pages/CatalogDetail.tsx` | Update hooks |
| `frontend/src/ui/pages/CatalogNew.tsx` | useSearchParams → useSearch |
| `frontend/src/ui/pages/CatalogNewPlant.tsx` | Update hooks |
| `frontend/src/ui/pages/Login.tsx` | Update navigate calls |
| `frontend/src/ui/components/ExploreGrid.tsx` | Update import |
| `frontend/src/ui/components/PlantDetails.tsx` | Update hooks |
| `frontend/src/ui/components/WateringList.tsx` | Update navigate calls |
| `frontend/src/ui/components/PlantForm.tsx` | Update hooks |
| `frontend/src/ui/components/SpeciesCatalog.tsx` | Update import |
| `frontend/src/ui/components/PlantsList.tsx` | Update hooks |
| `frontend/src/ui/components/SpeciesView.tsx` | Update hooks, fix `to="back"` |
| `frontend/src/ui/components/DeleteButton.tsx` | Update navigate calls |
| `frontend/src/ui/components/WateringHistoryGrid.tsx` | Update import |

**Total: 22 files (21 modified, 1 new, 1 deleted)**
