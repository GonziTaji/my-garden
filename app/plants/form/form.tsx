import { useState } from "react"

interface NewPlantNameFormFormData {
  name: string;
  alias: string;
}

export interface NewPlantNameFormProps {
  className?: string
  onSubmit?: (fd: NewPlantNameFormFormData) => Promise<void>
  onDismiss?: () => void
  dismissLabel?: string
  disabled?: boolean
}

export default function NewPlantNameForm() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    const fd = new FormData(e.currentTarget)

    console.log('in form component', Object.fromEntries(fd.entries()))

    const data: NewPlantNameFormFormData = {
      name: fd.get("name") as string || "",
      alias: fd.get("alias") as string || "",
    }

    if (data.alias.trim() === "") {
      setIsLoading(false)
      return
    }

    // fetch
    await new Promise(res => setTimeout(res, 3 * 1000))

    setIsLoading(false)
  }

  return (
    <form className="new-plant-name-form" onSubmit={handleSubmit}>
      <fieldset>
        <legend>Alias</legend>

        <input
          name="alias"
          type="text"
          placeholder="Jade plant"
          minLength={3}
          disabled={isLoading}
          required
        />
      </fieldset>

      <fieldset>
        <legend>Name</legend>

        <input
          name="name"
          type="text"
          placeholder="Crassula Ovata"
          minLength={3}
          disabled={isLoading}
        />
      </fieldset>

      <button type="submit" disabled={isLoading}>Save</button>
      <button type="reset">Reset</button>
    </form>
  )
}

