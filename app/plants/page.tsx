import plantsStore from "@/db/store";
import PlantsList, { PlantListItem } from "./components/PlantsList";
import CreatePlantForm from "./components/CreatePlantForm";

const getPlants = async (): Promise<PlantListItem[]> => {
    const raw = await plantsStore.listAll()

    return raw.map(p => ({ id: p.id || 0, name: p.name || '', alias: p.alias }))
}

export default async function Page() {
    const plants = await getPlants()

    return (
        <>
            <PlantsList plants={plants} />
            <CreatePlantForm />
        </>
    )
}
