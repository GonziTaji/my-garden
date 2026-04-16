import { PlantDefinition } from "@/domain/plants/plant-definition";
import PlantDefinitionDetails from "../components/PlantDefinitionDetails";

const newDefinition: PlantDefinition = {
    id: null,
    commonName: "",
    scientificName: "",
    waterProfile: "dry_cycle",
    lightLevel: "low",
    soilType: "well_draining",
    petToxicity: "non_toxic",
    petToxicityNotes: "",
    categories: [],
    images: [],
}

export default function Page() {
    return (
        <div>
            <PlantDefinitionDetails definition={{ ...newDefinition }} isEdit={true} />
        </div>
    )
}
