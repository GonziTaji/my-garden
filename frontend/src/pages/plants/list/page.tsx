export interface PlantListItem {
  id: number
  alias: string
  name: string
}

interface PlantsListProps {
  plants: PlantListItem[]
}

export default function PlantsList({ plants }: PlantsListProps) {
  if (!Array.isArray(plants)) {
    throw new Error("plants is not an array")
  }

  return (
    <main id="plants-list-page-content">
      <h1>My garden</h1>

      <section>
        <ul className="plants-list">
          {plants.map((p) =>
            <li key={p.id}>
              <details>
                <summary className="plant-item-button">
                  <span className="plant-item-alias">{p.alias}</span>
                  <small className="plant-item-name">{p.name}</small>
                </summary>
                <div>
                  asdflkajsdlkfj
                  <a href="./view">See details</a>
                </div>
              </details>
            </li>
          )}
        </ul>
      </section>

      <section>
        <nav>
          <ul>
            <li>
              <button>Summary</button>
            </li>
            <li>
              <button>Details</button>
            </li>
            <li>
              <button>Journal</button>
            </li>
          </ul>
        </nav>
      </section>
    </main>
  )
}
