'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AportacionCapital, Accionista } from '@/lib/types'
import { formatMXN } from '@/lib/format'

interface Props {
  accionistas: Accionista[]
  aportacionesIniciales: AportacionCapital[]
}

export default function AportacionesCrud({
  accionistas,
  aportacionesIniciales,
}: Props) {
  const [aportaciones, setAportaciones] = useState<AportacionCapital[]>(
    aportacionesIniciales
  )
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState('')
  const [accionistaId, setAccionistaId] = useState(
    accionistas[0]?.id ?? ''
  )
  const [confirmada, setConfirmada] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [disponible, setDisponible] = useState(true)

  useEffect(() => {
    try {
      createClient()
    } catch {
      setDisponible(false)
    }
  }, [])

  async function recargar() {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('aportaciones_capital')
        .select('*')
      if (data) setAportaciones(data as AportacionCapital[])
    } catch {
      /* sin conexión */
    }
  }

  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('aportaciones_capital').insert({
        accionista_id: accionistaId,
        monto: Number(monto) || 0,
        moneda: 'MXN',
        fecha,
        confirmada,
      })
      if (error) {
        setError(error.message)
        return
      }
      setMonto('')
      setFecha('')
      await recargar()
    } catch {
      setError('No se pudo conectar con la base de datos.')
    }
  }

  async function eliminar(id: string) {
    try {
      const supabase = createClient()
      await supabase.from('aportaciones_capital').delete().eq('id', id)
      await recargar()
    } catch {
      setError('No se pudo eliminar.')
    }
  }

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <h3 className="font-serif text-lg text-navy mb-3">
        Aportaciones de capital
      </h3>

      {!disponible ? (
        <p className="font-sans text-sm text-warn mb-3">
          Sin conexión a la base de datos. El CRUD opera en modo de solo
          lectura.
        </p>
      ) : null}

      <form
        onSubmit={agregar}
        className="flex flex-wrap items-end gap-3 mb-4 font-sans text-sm"
      >
        <label className="flex flex-col">
          <span className="text-dark/60">Accionista</span>
          <select
            value={accionistaId}
            onChange={(e) => setAccionistaId(e.target.value)}
            className="border rounded px-2 py-1"
          >
            {accionistas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col">
          <span className="text-dark/60">Monto</span>
          <input
            type="number"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-dark/60">Fecha</span>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={confirmada}
            onChange={(e) => setConfirmada(e.target.checked)}
          />
          <span className="text-dark/60">Confirmada</span>
        </label>
        <button
          type="submit"
          className="bg-teal text-white rounded px-3 py-1.5"
        >
          Agregar
        </button>
      </form>

      {error ? (
        <p className="font-sans text-sm text-danger mb-3">{error}</p>
      ) : null}

      <ul className="flex flex-col gap-1 font-sans text-sm">
        {aportaciones.length === 0 ? (
          <li className="text-dark/60">Sin aportaciones registradas.</li>
        ) : (
          aportaciones.map((ap) => {
            const acc = accionistas.find((a) => a.id === ap.accionista_id)
            return (
              <li
                key={ap.id}
                className="flex items-center justify-between border-b py-1"
              >
                <span>
                  {acc?.nombre ?? ap.accionista_id} · {formatMXN(ap.monto)} ·{' '}
                  {ap.fecha} · {ap.confirmada ? 'Confirmada' : 'Pendiente'}
                </span>
                <button
                  type="button"
                  onClick={() => eliminar(ap.id)}
                  className="text-danger hover:underline"
                >
                  Eliminar
                </button>
              </li>
            )
          })
        )}
      </ul>
    </div>
  )
}
