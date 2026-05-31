import CatalogDetail from "@/pages/CatalogDetail";
import CatalogList from "@/pages/CatalogList";
import CatalogNew from "@/pages/CatalogNew";
import Home from "@/pages/Home";
import PlantDetailPage from "@/pages/PlantDetail";
import PlantNew from "@/pages/PlantNew";
import PlantsList from "@/pages/PlantsList";

export type RouterPath = typeof routerPaths[number]["path"]

export const routerPaths = [
  { path: "/", component: Home },
  { path: "/plants", component: PlantsList },
  { path: "/plants/new", component: PlantNew },
  { path: "/plants/:plantid", component: PlantDetailPage },
  { path: "/catalog", component: CatalogList },
  { path: "/catalog/new", component: CatalogNew },
  { path: "/catalog/:plantdefid", component: CatalogDetail },
] as const

