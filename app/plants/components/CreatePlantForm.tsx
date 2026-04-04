import { createPlant } from "../actions"

export interface CreatePlantFormData {
    alias: string
    name: string
}

export default function CreatePlantForm() {
    // const [isCreatingPlant, setIsCreatingPlant] = useState(false)

    // const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    //     e.preventDefault()
    //     setIsCreatingPlant(true)
    //
    //     const fd = new FormData(e.currentTarget)
    //
    //     const data: CreatePlantFormData = {
    //         name: fd.get("name") as string || "",
    //         alias: fd.get("alias") as string || "",
    //     }
    //
    //     if (data.alias.trim() === "") {
    //         setIsCreatingPlant(false)
    //         return
    //     }
    //
    //     // fetch
    //     const r = await fetch("api/plants/", { method: "POST", body: JSON.stringify(data) })
    //     if (!r.ok) {
    //         setIsCreatingPlant(false)
    //         alert(r.statusText)
    //         return
    //     }
    //
    //     if (r.status != 201) {
    //         setIsCreatingPlant(false)
    //         alert(r.statusText)
    //         return
    //     }
    //
    //     const location = r.headers.get('location')
    //     if (!location) {
    //         setIsCreatingPlant(false)
    //         alert('Something happened: Created plant not found. Refresh this page.')
    //         return
    //     }
    //
    //     window.location.replace(location)
    //     setIsCreatingPlant(false)
    // }

    return (
        <form className="new-plant-name-form" action={createPlant}>
            <div>
                <label htmlFor="plant-alias">Alias</label>
                <input
                    id="plant-alias"
                    name="alias"
                    type="text"
                    placeholder="Jade plant"
                    minLength={3}
                    // disabled={isCreatingPlant}
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
                // disabled={isCreatingPlant}
                />
            </div>
            <button type="submit"
            // disabled={isCreatingPlant}
            >Save</button>
            <button type="reset">Reset</button>
            <span>asdfa</span>
        </form>
    )
}


