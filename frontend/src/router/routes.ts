import CatalogDetail from '@/ui/pages/CatalogDetail'
import CatalogList from '@/ui/pages/CatalogList'
import CatalogNew from '@/ui/pages/CatalogNew'
import CatalogNewPlant from '@/ui/pages/CatalogNewPlant'
import Home from '@/ui/pages/Explore'
import Login from '@/ui/pages/Login'
import PlantDetailPage from '@/ui/pages/PlantDetail'
import PlantNew from '@/ui/pages/PlantNew'
import PlantsList from '@/ui/pages/PlantsList'

export type RouterPath = (typeof routerPaths)[number]['path']

export const routerPaths = [
  { path: '/', component: Home },
  { path: '/plants', component: PlantsList },
  { path: '/plants/new', component: PlantNew },
  { path: '/plants/:plantid', component: PlantDetailPage },
  { path: '/catalog', component: CatalogList },
  { path: '/catalog/new', component: CatalogNew },
  { path: '/catalog/:plantdefid', component: CatalogDetail },
  { path: '/catalog/:plantdefid/new-plant', component: CatalogNewPlant },
  { path: '/login', component: Login },
] as const
