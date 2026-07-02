import { useState, type SubmitEvent } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { buttonVariants } from '@/ui/classVariants/button'
import { useNavigate } from '@/router/provider'

export default function Login() {
  const { sendLoginEmail, verifyCode } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    try {
      await sendLoginEmail(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el enlace')
    }
  }

  const handleVerifyCode = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    try {
      await verifyCode(code)
      navigate('/')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Código inválido o expirado'
      )
    }
  }

  if (sent) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-secondary-dark">
          Revisa tu correo
        </h2>
        <p className="text-secondary-strong mt-2">
          Te hemos enviado un código a <strong>{email}</strong>
        </p>
        <form
          onSubmit={handleVerifyCode}
          className="flex flex-col gap-4 max-w-sm mx-auto mt-6"
        >
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ej: A3K9M2X7"
            required
            autoFocus
            maxLength={8}
            className="border border-secondary-default rounded-md p-2 text-center text-lg tracking-widest uppercase"
          />
          {error && <p className="text-danger-strong text-sm">{error}</p>}
          <button
            type="submit"
            className={buttonVariants({ variant: 'primary' })}
          >
            Verificar código
          </button>
        </form>
        <button
          onClick={() => {
            setSent(false)
            setCode('')
            setError('')
          }}
          className="text-secondary-strong underline mt-4 text-sm"
        >
          Volver
        </button>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-secondary-dark mb-4">
        Iniciar sesión
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          required
          className="border border-secondary-default rounded-md p-2"
        />
        {error && <p className="text-danger-strong text-sm">{error}</p>}
        <button
          type="submit"
          className={buttonVariants({ variant: 'primary' })}
        >
          Enviar código de acceso
        </button>
      </form>
    </div>
  )
}
