import { PlantDefinition } from "@/domain/plants/plant-definition";
import DefinitionView from "../../../ui/components/DefinitionView";

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
            <DefinitionView record={{ ...newDefinition }} editMode={true} />
        </div>
    )
}
