import mountStrict from "../../../utils/mountReactNode"
import PlantsList, { type PlantListItem } from "./components/plants-list"
import './styles.css'


// TODO: get from backend
const plants: PlantListItem[] = [
  {
    id: 1,
    alias: "Costilla de Adán",
    name: "Monstera deliciosa",
  },
  {
    id: 2,
    alias: "Ficus lira",
    name: "Ficus lyrata",
  },
  {
    id: 3,
    alias: "Lengua de suegra",
    name: "Dracaena trifasciata",
  },
  {
    id: 4,
    alias: "Poto",
    name: "Epipremnum aureum",
  },
  {
    id: 5,
    alias: "Calatea orbifolia",
    name: "Calathea orbifolia",
  },
  {
    id: 6,
    alias: "Aloe vera",
    name: "Aloe vera",
  },
]

mountStrict("#root", <PlantsList plants={plants} />)
