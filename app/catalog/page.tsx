import { plantCategory } from "@/domain/plants/category/plant-category"
import { lightLevel } from "@/domain/plants/light/light-level"
import { soilType } from "@/domain/plants/soil/soil-type"
import { waterProfile } from "@/domain/plants/water/water-profile"
import plantDefinitionsService from "@/services/plant-definitions.service"
import { cn } from "@sglara/cn"
import Link from "next/link"
import Image from "next/image"

export default async function PlantDefinitionsPage() {
    const definitionsList = await plantDefinitionsService.list()

    return (
        <div id="plant-definitions-page">
            <nav className="grid grid-cols-2">
                {definitionsList.map((d) => (
                    <Link
                        key={d.id}
                        href={`/catalog/${d.id}`}
                        className="bg-olive-50"
                    >
                        <div className="p-12 pb-0">
                            {d.images[0] ? (
                                <Image src={d.images[0].filepath} className="aspect-square object-cover" alt={`Imagen de ${d.commonName}`} width={150} height={150} />
                            ) : (
                                <div className="aspect-square text-center content-center border border-dashed border-olive-300 text-sm text-slate-500">
                                    Sin imagen
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col items-center">
                            <span className="font-semibold text-xl">{d.commonName}</span>
                            <span className="italic text-xl">{d.scientificName}</span>

                            <div className="text-sm">
                                {d.categories.map((c) => <span key={c}>{plantCategory.meta[c].label}</span>)}
                            </div>

                            <div>
                                {waterProfile.values.map((w, i) => (
                                    <span key={w} className={cn(waterProfile.values.indexOf(d.waterProfile) < i && 'grayscale')}>
                                        💧
                                    </span>
                                ))}
                            </div>

                            <div>
                                {lightLevel.values.map((l, i) => (
                                    <span key={l} className={cn(lightLevel.values.indexOf(d.lightLevel) < i && 'grayscale')}>
                                        ☀️
                                    </span>
                                ))}
                            </div>

                            <div>
                                {soilType.values.toReversed().map((s, i) => (
                                    <span key={s} className={cn(soilType.values.indexOf(d.soilType) < i && 'grayscale')}>
                                        🤿
                                    </span>
                                ))}
                            </div>
                        </div>
                    </Link>
                ))}
            </nav>

        </div>
    )
}
