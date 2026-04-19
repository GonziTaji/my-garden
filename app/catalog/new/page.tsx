import { PlantDefinition } from "@/domain/plants/plant-definition";
import DefinitionView from "../../../ui/components/DefinitionView";
import { buttonVariants } from "@/ui/classVariants/button";
import Link from "next/link";

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
            <div className="py-8 flex gap-4">
                <Link href={`/`} className={buttonVariants({ variant: 'tertiary' })}>
                    Inicio
                </Link>

                <Link href={`/plants`} className={buttonVariants({ variant: 'tertiary' })}>
                    Cátalogo
                </Link>
            </div>

            <DefinitionView record={{ ...newDefinition }} editMode={true} />
        </div>
    )
}
