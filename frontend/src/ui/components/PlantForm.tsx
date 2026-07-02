import { useTransition, useState, useMemo } from 'react'
import { buttonVariants } from '@/ui/classVariants/button'
import { cva } from 'class-variance-authority'
import { useNavigate } from '@/router/provider'
import { useCreatePlant } from '@/api/plants'
import { useCreateDefinition, useDefinitions } from '@/api/definitions'
import { cn } from '@sglara/cn'
import { Link } from '@/router/components/Link'

const inputVariants = cva(
  [
    'border',
    'border-primary-default',
    'outline-primary-default',
    'rounded-lg',
    'min-w-0',
    'w-full',
    'p-2',
  ],
  {
    variants: {},
  }
)

const waterProfiles = [
  { value: 'dry_cycle', label: 'Hasta secarse' },
  { value: 'semi_dry_cycle', label: 'Parcialmente seco' },
  { value: 'even_moisture', label: 'Mantener húmedo' },
  { value: 'wet', label: 'Encharcado' },
]

export interface PlantFormProps {
  plantDefinitionId?: number
}

export default function PlantForm({ plantDefinitionId }: PlantFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { data: plantDefinitions } = useDefinitions()
  const createPlant = useCreatePlant()
  const createDefinition = useCreateDefinition()

  const [speciesMode, setSpeciesMode] = useState<'catalog' | 'quick' | 'new'>(
    'catalog'
  )
  const [quickName, setQuickName] = useState('')
  const [quickWater, setQuickWater] = useState('dry_cycle')
  const [selectedDefId, setSelectedDefId] = useState<number | undefined>(
    undefined
  )

  const ownedDefinitions = useMemo(() => {
    if (!plantDefinitions) return []
    return plantDefinitions.filter((d) => d.userId !== undefined)
  }, [plantDefinitions])

  const definitionName = useMemo(() => {
    if (!plantDefinitionId || !plantDefinitions) return ''
    const def = plantDefinitions.find((d) => d.id === plantDefinitionId)
    return def ? def.commonName : ''
  }, [plantDefinitionId, plantDefinitions])

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        let defId = plantDefinitionId

        if (!defId && speciesMode === 'quick') {
          if (!quickName.trim()) {
            setError('El nombre de la especie es requerido')
            return
          }
          const newDef = await createDefinition.mutateAsync({
            common_name: quickName.trim(),
            scientific_name: '',
            water_profile: quickWater,
            is_quick: true,
          })
          defId = newDef.id
        }

        if (!defId && speciesMode === 'catalog') {
          if (!selectedDefId) {
            setError('Selecciona una especie del catálogo')
            return
          }
          defId = selectedDefId
        }

        if (!defId) {
          setError('No se ha seleccionado ninguna especie')
          return
        }

        const result = await createPlant.mutateAsync({
          nickname: fd.get('nickname')?.toString() || '',
          source: fd.get('source')?.toString() || '',
          location: fd.get('location')?.toString() || undefined,
          acquired_at: fd.get('acquiredAt')?.toString() || undefined,
          notes: fd.get('notes')?.toString() || undefined,
          plant_definition_id: defId,
        })

        if (result?.id) {
          navigate('/plants/:plantid', {
            params: { plantid: String(result.id) },
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error inesperado')
      }
    })
  }

  return (
    <form
      onSubmit={submit}
      className="mx-8 p-8 flex flex-col gap-8 border border-secondary-subtle"
    >
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      <fieldset>
        <div className="flex flex-col gap-2">
          <label htmlFor="plantDefinitionId">Especie</label>

          {plantDefinitionId ? (
            <div className="border border-primary-default rounded-lg p-2 text-sm bg-primary-light">
              {definitionName || `ID: ${plantDefinitionId}`}
              <input
                type="hidden"
                name="plantDefinitionId"
                value={plantDefinitionId}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="speciesMode"
                  checked={speciesMode === 'catalog'}
                  onChange={() => setSpeciesMode('catalog')}
                />
                Usar de mi catálogo
              </label>
              {speciesMode === 'catalog' && (
                <select
                  value={selectedDefId || ''}
                  onChange={(e) =>
                    setSelectedDefId(Number(e.target.value) || undefined)
                  }
                  className={inputVariants()}
                >
                  <option value="">Seleccionar especie...</option>
                  {ownedDefinitions.map((d) => (
                    <option key={d.id} value={d.id!}>
                      {d.commonName}
                    </option>
                  ))}
                </select>
              )}

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="speciesMode"
                  checked={speciesMode === 'quick'}
                  onChange={() => setSpeciesMode('quick')}
                />
                Especie rápida
              </label>
              {speciesMode === 'quick' && (
                <div className="flex flex-col gap-2 ml-6">
                  <input
                    className={inputVariants()}
                    type="text"
                    placeholder="Nombre común"
                    value={quickName}
                    onChange={(e) => setQuickName(e.target.value)}
                  />
                  <select
                    value={quickWater}
                    onChange={(e) => setQuickWater(e.target.value)}
                    className={inputVariants()}
                  >
                    {waterProfiles.map((wp) => (
                      <option key={wp.value} value={wp.value}>
                        {wp.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="speciesMode"
                  checked={speciesMode === 'new'}
                  onChange={() => setSpeciesMode('new')}
                />
                Crear nueva especie
              </label>
              {speciesMode === 'new' && (
                <Link
                  to="/catalog/new"
                  className="text-primary-strong underline text-sm ml-6"
                >
                  Ir a crear nueva especie
                </Link>
              )}
            </div>
          )}
        </div>
      </fieldset>

      {speciesMode !== 'new' && (
        <fieldset className="grid gap-8 overflow-auto">
          <div className="flex flex-col gap-2">
            <label htmlFor="nickname">Nombre (apodo)</label>
            <input
              className={inputVariants()}
              id="nickname"
              name="nickname"
              type="text"
              placeholder="Mi monstera del balcon"
              minLength={1}
              disabled={isPending}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="source">Fuente</label>
            <input
              className={inputVariants()}
              id="source"
              name="source"
              type="text"
              placeholder="Regalo, compra, etc."
              minLength={1}
              disabled={isPending}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="location">Ubicacion (opcional)</label>
            <input
              className={inputVariants()}
              id="location"
              name="location"
              type="text"
              placeholder="Balcon, sala, habitacion..."
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="acquiredAt">Fecha de adquisicion (opcional)</label>
            <input
              className={inputVariants()}
              id="acquiredAt"
              name="acquiredAt"
              type="date"
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="notes">Notas (opcional)</label>
            <textarea
              className={inputVariants()}
              id="notes"
              name="notes"
              placeholder="Cualquier informacion adicional..."
              disabled={isPending}
              rows={3}
            />
          </div>
        </fieldset>
      )}

      <div className="flex justify-end gap-4">
        <button
          className={buttonVariants({ variant: 'secondary' })}
          type="reset"
          disabled={isPending}
          onClick={() => navigate('/plants')}
        >
          Cancelar
        </button>

        {speciesMode !== 'new' && (
          <button
            type="submit"
            disabled={isPending}
            className={buttonVariants({ variant: 'primary' })}
          >
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
        )}
      </div>
    </form>
  )
}
