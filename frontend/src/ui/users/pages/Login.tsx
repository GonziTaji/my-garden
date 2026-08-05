import { useState, type SubmitEvent } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { buttonVariants } from '@/ui/class-variants/button'
import { useNavigate } from '@tanstack/react-router'

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
      setSent(true)
      await sendLoginEmail(email)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el enlace')
    }
  }

  const handleVerifyCode = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    try {
      await verifyCode(code)
      navigate({ to: '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código inválido o expirado')
    }
  }

  if (sent) {
    return (
      <div className="p-8 flex flex-col items-center">
        <div className="w-full max-w-sm bg-surface-raised rounded-2xl shadow-sm border border-neutral-subtle/30 p-8">
          <h2 className="text-2xl font-bold text-center text-neutral-dark">Revisa tu correo</h2>
          <p className="text-neutral-strong mt-2 text-center text-sm">
            Te hemos enviado un código a <strong className="text-neutral-dark">{email}</strong>
          </p>
          <form onSubmit={handleVerifyCode} className="flex flex-col gap-4 mt-6">
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Ej: 839247"
              required
              autoFocus
              maxLength={6}
              className="border border-neutral-subtle/60 rounded-xl p-3 text-center text-lg tracking-widest bg-surface-raised text-neutral-dark focus:outline-none focus:border-primary-strong focus:ring-2 focus:ring-primary-subtle transition-all"
            />
            {error && <p className="text-danger-strong text-sm text-center">{error}</p>}
            <button type="submit" className={buttonVariants({ variant: 'primary' })}>
              Verificar código
            </button>
          </form>
          <button
            type="button"
            onClick={() => {
              setSent(false)
              setCode('')
              setError('')
            }}
            className="text-neutral-strong hover:text-primary-dark mt-4 text-sm w-full text-center transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 flex flex-col items-center">
      <div className="w-full max-w-sm bg-surface-raised rounded-2xl shadow-sm border border-neutral-subtle/30 p-8">
        <h2 className="text-2xl font-bold text-center text-neutral-dark mb-6">Iniciar sesión</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            className="border border-neutral-subtle/60 rounded-xl p-3 bg-surface-raised text-neutral-dark placeholder:text-neutral-default focus:outline-none focus:border-primary-strong focus:ring-2 focus:ring-primary-subtle transition-all"
          />
          {error && <p className="text-danger-strong text-sm text-center">{error}</p>}
          <button type="submit" className={buttonVariants({ variant: 'primary' })}>
            Enviar código de acceso
          </button>
        </form>
      </div>
    </div>
  )
}
