'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import DataTable from '@/components/DataTable'
import { formatMXN, mesNombre } from '@/lib/format'
import type { Gasto } from '@/lib/types'

export const CATEGORIAS_GASTO = [
  'saas_herramientas',
  'infraestructura',
  'contabilidad',
  'marketing',
  'renta',
  'servicios',
  'nomina',
  'comisiones',
  'impuestos',
  'equipo_computo',
  'unico',
  'otros',
] as const

const schema = z.object({
  fecha: z.string().min(1, 'Fecha requerida'),
  concepto: z.string().min(1, 'Concepto requerido'),
  categoria: z.enum(CATEGORIAS_GASTO),
  monto: z.coerce.number().positive('Monto debe ser mayor a 0'),
  proveedor: z.string().optional(),
  metodo_pago: z.string().optional(),
  es_cogs: z.boolean().optional(),
})

type FormValues = z.input<typeof schema>

interface GastoRow extends Gasto {
  proveedor: string | null
  metodo_pago?: string | null
}

export default function GastosCrud({
  gastosIniciales,
}: {
  gastosIniciales: Gasto[]
}) {
  const [gastos, setGastos] = useState<Gasto[]>(gastosIniciales)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [catFiltro, setCatFiltro] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { categoria: 'otros' },
  })

  async function recargar() {
    try {
      const supabase = createClient()
      const { data } = await supabase.from('gastos').select('*')
      if (data) setGastos(data as Gasto[])
    } catch {
      /* noop */
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    try {
      const supabase = createClient()
      const fecha = String(values.fecha)
      const d = new Date(fecha)
      const mes = d.getMonth() + 1
      const anio = d.getFullYear()
      const monto = Number(values.monto) || 0

      const { data: inserted, error: gErr } = await supabase
        .from('gastos')
        .insert({
          concepto: values.concepto,
          categoria: values.categoria,
          proveedor: values.proveedor || null,
          metodo_pago: values.metodo_pago || null,
          monto,
          moneda: 'MXN',
          mes,
          anio,
          fecha,
          es_cogs: !!values.es_cogs,
        })
        .select('id')
        .single()

      if (gErr) {
        setError(gErr.message)
        return
      }

      // Mirror into movimientos_caja as a salida (egreso).
      await supabase.from('movimientos_caja').insert({
        tipo: 'egreso',
        monto: -Math.abs(monto),
        concepto: `Gasto: ${values.concepto}`,
        origen_tabla: 'gastos',
        origen_id: inserted?.id ?? null,
        mes,
        anio,
        fecha,
      })

      reset({ categoria: 'otros' })
      setOpen(false)
      await recargar()
    } catch {
      setError('No se pudo conectar con la base de datos.')
    }
  })

  const filtrados = useMemo(() => {
    return gastos.filter((g) => {
      if (desde && g.fecha < desde) return false
      if (hasta && g.fecha > hasta) return false
      if (catFiltro && g.categoria !== catFiltro) return false
      return true
    })
  }, [gastos, desde, hasta, catFiltro])

  const total = filtrados.reduce((a, g) => a + (g.monto || 0), 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3 font-sans text-sm">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col">
            <span className="text-dark/60">Desde</span>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="rounded border px-2 py-1"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-dark/60">Hasta</span>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="rounded border px-2 py-1"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-dark/60">Categoría</span>
            <select
              value={catFiltro}
              onChange={(e) => setCatFiltro(e.target.value)}
              className="rounded border px-2 py-1"
            >
              <option value="">Todas</option>
              {CATEGORIAS_GASTO.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md bg-teal px-4 py-2 font-semibold text-white hover:bg-navy"
        >
          + Nuevo Gasto
        </button>
      </div>

      <div className="rounded-lg bg-white p-3 shadow-sm font-sans text-sm">
        <span className="text-dark/60">Total filtrado: </span>
        <span className="font-serif text-lg text-navy">{formatMXN(total)}</span>
        <span className="text-dark/50"> · {filtrados.length} gastos</span>
      </div>

      <DataTable<GastoRow>
        rows={filtrados as GastoRow[]}
        sortable
        columns={[
          { key: 'fecha', label: 'Fecha' },
          { key: 'concepto', label: 'Concepto' },
          { key: 'categoria', label: 'Categoría' },
          {
            key: 'monto',
            label: 'Monto',
            align: 'right',
            format: (v) => formatMXN(Number(v) || 0),
          },
          { key: 'proveedor', label: 'Proveedor', format: (v) => v || '—' },
          {
            key: 'metodo_pago',
            label: 'Método de pago',
            format: (v) => v || '—',
          },
          {
            key: 'mes',
            label: 'Periodo',
            format: (_v, r) => `${mesNombre(r.mes)} ${r.anio}`,
          },
        ]}
      />

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-xl text-navy">Nuevo Gasto</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-dark/50 hover:text-danger"
              >
                ✕
              </button>
            </div>
            <form onSubmit={onSubmit} className="flex flex-col gap-3 font-sans text-sm">
              <label className="flex flex-col">
                <span className="text-dark/60">Fecha</span>
                <input type="date" {...register('fecha')} className="rounded border px-2 py-1" />
                {errors.fecha && <span className="text-danger">{errors.fecha.message}</span>}
              </label>
              <label className="flex flex-col">
                <span className="text-dark/60">Concepto</span>
                <input {...register('concepto')} className="rounded border px-2 py-1" />
                {errors.concepto && <span className="text-danger">{errors.concepto.message}</span>}
              </label>
              <label className="flex flex-col">
                <span className="text-dark/60">Categoría</span>
                <select {...register('categoria')} className="rounded border px-2 py-1">
                  {CATEGORIAS_GASTO.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col">
                <span className="text-dark/60">Monto (MXN)</span>
                <input type="number" step="0.01" {...register('monto')} className="rounded border px-2 py-1" />
                {errors.monto && <span className="text-danger">{errors.monto.message}</span>}
              </label>
              <label className="flex flex-col">
                <span className="text-dark/60">Proveedor</span>
                <input {...register('proveedor')} className="rounded border px-2 py-1" />
              </label>
              <label className="flex flex-col">
                <span className="text-dark/60">Método de pago</span>
                <input {...register('metodo_pago')} className="rounded border px-2 py-1" />
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register('es_cogs')} />
                <span className="text-dark/60">Es COGS</span>
              </label>

              {error && <p className="text-danger">{error}</p>}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md border px-4 py-2"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-teal px-4 py-2 font-semibold text-white hover:bg-navy disabled:opacity-60"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
