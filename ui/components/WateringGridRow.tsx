import WateringGridCell from './WateringGridCell'

interface PlantWithDefinition {
    id: number
    nickname: string
    plantDefinition: {
        commonName: string
    }
}

interface WateringGridRowProps {
    plant: PlantWithDefinition
    dates: string[]
    wateredDates: Set<string>
}

export default function WateringGridRow({ plant, dates, wateredDates }: WateringGridRowProps) {
    return (
        <tr className="hover:bg-gray-50">
            <td className="p-2 border-b">
                <div className="font-medium">{plant.nickname}</div>
                <div className="text-xs text-gray-500">{plant.plantDefinition.commonName}</div>
            </td>
            {dates.map((date) => (
                <td key={date} className="p-1 border-b text-center">
                    <WateringGridCell
                        plantId={plant.id}
                        date={date}
                        isWatered={wateredDates.has(date)}
                    />
                </td>
            ))}
        </tr>
    )
}