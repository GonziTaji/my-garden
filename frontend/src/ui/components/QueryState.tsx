interface QueryStateProps {
  isLoading?: boolean
  error?: unknown
  loadingText?: string
  children: React.ReactNode
}

export function QueryState({ isLoading, error, loadingText = 'Cargando...', children }: QueryStateProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <p className="text-neutral-strong">{loadingText}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <p className="text-danger-strong">Error al cargar</p>
      </div>
    )
  }

  return <>{children}</>
}
