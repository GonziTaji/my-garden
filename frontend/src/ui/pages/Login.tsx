import { useState } from "react"
import { useAuth } from "@/auth/AuthContext"
import { buttonVariants } from "@/ui/classVariants/button"

export default function Login() {
  const { sendLoginEmail } = useAuth()
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      await sendLoginEmail(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar el enlace")
    }
  }

  if (sent) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-olive-700">Revisa tu correo</h2>
        <p className="text-olive-500 mt-2">
          Te hemos enviado un enlace mágico a <strong>{email}</strong>
        </p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-olive-700 mb-4">Iniciar sesión</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          required
          className="border border-olive-300 rounded-md p-2"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className={buttonVariants({ variant: "primary" })}>
          Enviar enlace mágico
        </button>
      </form>
    </div>
  )
}
