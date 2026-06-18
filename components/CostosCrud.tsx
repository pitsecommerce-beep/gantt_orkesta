'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CostoFijo, Moneda } from '@/lib/types'
import { formatMXN } from '@/lib/format'

export default function CostosCrud({
  costosIniciales,
}: {
  costosIniciales: CostoFijo[]
}) {
  const [costos, setCostos] = useState<CostoFijo[]>(costosIniciales)
  const [concepto, setConcepto] = useState('')
  const [categoria, setCategoria] = useState('')
  const [monto, setMonto] = useState('')
  const [moneda, setMoneda] = useState<Moneda>('MXN')
  const [recurrente, setRecurrente] = useState(true)
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
      const { data } = await supabase.from('costos_fijos').select('*')
      if (data) setCostos(data as CostoFijo[])
    } catch {
      /* noop */
    }
  }

  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('costos_fijos').insert({
        concepto,
        categoria,
        monto: Number(monto) || 0,
        moneda,
        recurrente,
        activo: true,
      })
      if (error) {
        setError(error.message)
        return
      }
      setConcepto('')
      setCategoria('')
      setMonto('')
      await recargar()
    } catch {
      setError('No se pudo conectar con la base de datos.')
    }
  }

  async function eliminar(id: string) {
    try {
      const supabase = createClient()
      await supabase.from('costos_fijos').delete().eq('id', id)
      await recargar()
    } catch {
      setError('No se pudo eliminar.')
    }
  }

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <h3 className="font-serif text-lg text-navy mb-3">Gestionar costos fijos</h3>
      {!disponible ? (
        <p className="font-sans text-sm text-warn mb-3">
          Sin conexión a la base de datos.
        </p>
      ) : null}
      <form
        onSubmit={agregar}
        className="flex flex-wrap items-end gap-3 mb-4 font-sans text-sm"
      >
        <label className="flex flex-col">
          <span className="text-dark/60">Concepto</span>
          <input
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-dark/60">Categoría</span>
          <input
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="border rounded px-2 py-1"
          />
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
          <span className="text-dark/60">Moneda</span>
          <select
            value={moneda}
            onChange={(e) => setMoneda(e.target.value as Moneda)}
            className="border rounded px-2 py-1"
          >
            <option value="MXN">MXN</option>
            <option value="USD">USD</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={recurrente}
            onChange={(e) => setRecurrente(e.target.checked)}
          />
          <span className="text-dark/60">Recurrente</span>
        </label>
        <button type="submit" className="bg-teal text-white rounded px-3 py-1.5">
          Agregar
        </button>
      </form>
      {error ? (
        <p className="font-sans text-sm text-danger mb-3">{error}</p>
      ) : null}
      <ul className="flex flex-col gap-1 font-sans text-sm">
        {costos.length === 0 ? (
          <li className="text-dark/60">Sin costos registrados.</li>
        ) : (
          costos.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between border-b py-1"
            >
              <span>
                {c.concepto} · {c.categoria} · {formatMXN(c.monto)} {c.moneda} ·{' '}
                {c.recurrente ? 'Recurrente' : 'Único'}
              </span>
              <button
                type="button"
                onClick={() => eliminar(c.id)}
                className="text-danger hover:underline"
              >
                Eliminar
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
