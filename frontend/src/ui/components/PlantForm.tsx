import { useTransition, useState, useMemo, type SubmitEvent } from 'react'
import { buttonVariants } from '@/ui/classVariants/button'
import { cva } from 'class-variance-authority'
import { useNavigate } from '@/router/provider'
import { useCreatePlant } from '@/api/plants'
import { useCreateSpecies, useSpecies } from '@/api/species'
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
  plantSpeciesId?: number
}

export default function PlantForm({ plantSpeciesId }: PlantFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { data: plantSpecies } = useSpecies()
  const createPlant = useCreatePlant()
  const createSpecies = useCreateSpecies()

  const [speciesMode, setSpeciesMode] = useState<'catalog' | 'quick' | 'new'>(
    'catalog'
  )
  const [quickName, setQuickName] = useState('')
  const [quickWater, setQuickWater] = useState('dry_cycle')
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<
    number | undefined
  >(undefined)

  const ownedSpecies = useMemo(() => {
    if (!plantSpecies) return []
    return plantSpecies.filter((sp) => sp.userId !== undefined)
  }, [plantSpecies])

  const speciesName = useMemo(() => {
    if (!plantSpeciesId || !plantSpecies) return ''
    const sp = plantSpecies.find((sp) => sp.id === plantSpeciesId)
    return sp ? sp.commonName : ''
  }, [plantSpeciesId, plantSpecies])

  async function submit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        let defId = plantSpeciesId

        if (!defId && speciesMode === 'quick') {
          if (!quickName.trim()) {
            setError('El nombre de la especie es requerido')
            return
          }
          const newSp = await createSpecies.mutateAsync({
            common_name: quickName.trim(),
            scientific_name: '',
            water_profile: quickWater,
            is_quick: true,
          })
          defId = newSp.id
        }

        if (!defId && speciesMode === 'catalog') {
          if (!selectedSpeciesId) {
            setError('Selecciona una especie del catálogo')
            return
          }
          defId = selectedSpeciesId
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
          plant_species_id: defId,
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
          <label htmlFor="plantSpeciesId">Especie</label>

          {plantSpeciesId ? (
            <div className="border border-primary-default rounded-lg p-2 text-sm bg-primary-light">
              {speciesName || `ID: ${plantSpeciesId}`}
              <input
                type="hidden"
                name="plantSpeciesId"
                value={plantSpeciesId}
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
                  value={selectedSpeciesId || ''}
                  onChange={(e) =>
                    setSelectedSpeciesId(Number(e.target.value) || undefined)
                  }
                  className={inputVariants()}
                >
                  <option value="">Seleccionar especie...</option>
                  {ownedSpecies.map((sp) => (
                    <option key={sp.id} value={sp.id!}>
                      {sp.commonName}
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

          {
            // {[0, 1, 2].map((n) => (
            //   <ImageSelector
            //     image={record.images[n]}
            //     key={n}
            //     position={n}
            //   />
            // ))}
          }

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
          onClick={() => history.go(-1)}
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
