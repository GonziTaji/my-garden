import { buttonVariants } from '../classVariants/button';
import WateringGridRow from './WateringGridRow';
import { WateringHistoryGridProps, formatDateHeader } from './WateringHistoryGrid';


export default function WateringHistoryGrid({ plants, dates, wateredMap }: WateringHistoryGridProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-between">
        <div className="flex gap-4">
          <Link to="/" className={buttonVariants({ variant: 'tertiary' })}>
            Inicio
          </Link>
          <Link to="/plants" className={buttonVariants({ variant: 'tertiary' })}>
            Mis plantas
          </Link>
          <Link to="/catalog" className={buttonVariants({ variant: 'tertiary' })}>
            Catalogo
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left border-b min-w-[120px]">Planta</th>
              {dates.map((date) => (
                <th
                  key={date}
                  className="p-1 border-b text-center text-xs font-normal text-gray-500"
                >
                  <div className="transform -rotate-45 origin-center whitespace-nowrap">
                    {formatDateHeader(date)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plants.map((plant) => (
              <WateringGridRow
                key={plant.id}
                plant={plant}
                dates={dates}
                wateredDates={wateredMap.get(plant.id) ?? new Set()} />
            ))}
          </tbody>
        </table>
      </div>

      {plants.length === 0 && (
        <p className="text-center text-gray-500 py-8">
          No hay plantas registradas.
          <Link href="/plants/new" className="text-blue-500 hover:underline ml-1">
            Agregar planta
          </Link>
        </p>
      )}
    </div>
  );
}

