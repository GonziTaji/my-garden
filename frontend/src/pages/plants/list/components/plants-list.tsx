import { useState, type SubmitEvent } from "react"

interface CreatePlantFormData {
  alias: string
  name: string
}

export interface PlantListItem {
  id: number
  alias: string
  name: string
}

interface PlantsListProps {
  plants: PlantListItem[]
}

export default function PlantsList({ plants }: PlantsListProps) {
  const [isCreatingPlant, setIsCreatingPlant] = useState(false)

  alert("asdfasd")

  if (!Array.isArray(plants)) {
    throw new Error("plants is not an array")
  }


  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsCreatingPlant(true)

    const fd = new FormData(e.currentTarget)

    console.log('in form component', Object.fromEntries(fd.entries()))

    const data: CreatePlantFormData = {
      name: fd.get("name") as string || "",
      alias: fd.get("alias") as string || "",
    }

    if (data.alias.trim() === "") {
      setIsCreatingPlant(false)
      return
    }

    // fetch
    const r = await fetch("api/plants/", { method: "POST", body: JSON.stringify(data) })
    if (!r.ok) {
      setIsCreatingPlant(false)
      alert(r.statusText)
      return
    }

    if (r.status != 201) {
      setIsCreatingPlant(false)
      alert(r.statusText)
      return
    }

    const location = r.headers.get('location')
    if (!location) {
      setIsCreatingPlant(false)
      alert('Something happened: Created plant not found. Refresh this page.')
      return
    }

    window.location.replace(location)
    setIsCreatingPlant(false)
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


      <form className="new-plant-name-form" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="plant-alias">Alias</label>
          <input
            id="plant-alias"
            name="alias"
            type="text"
            placeholder="Jade plant"
            minLength={3}
            disabled={isCreatingPlant}
            required
          />
        </div>

        <div>
          <label htmlFor="plant-name">Name</label>
          <input
            id="plant-name"
            name="name"
            type="text"
            placeholder="Crassula Ovata"
            minLength={3}
            disabled={isCreatingPlant}
          />
        </div>
        <button type="submit" disabled={isCreatingPlant}>Save</button>
        <button type="reset">Reset</button>
        <span>asdfa</span>
      </form>
    </main>
  )
}
