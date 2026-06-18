'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import DataTable from '@/components/DataTable'
import { formatMXN } from '@/lib/format'
import type { Ingreso, Cliente, ModeloPrecio, TipoIngreso } from '@/lib/types'

const SEGMENTOS: ModeloPrecio[] = ['retail', 'schools', 'consulting']
const TIPOS: TipoIngreso[] = ['poc', 'recurrente', 'consulting']

const ingresoSchema = z.object({
  fecha: z.string().min(1, 'Fecha requerida'),
  cliente_id: z.string().optional(),
  concepto: z.string().min(1, 'Concepto requerido'),
  tipo: z.enum(['poc', 'recurrente', 'consulting']),
  monto: z.coerce.number().positive('Monto debe ser mayor a 0'),
  recurrente: z.boolean().optional(),
})
type IngresoForm = z.input<typeof ingresoSchema>

const clienteSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  segmento: z.enum(['retail', 'schools', 'consulting']),
  contacto: z.string().optional(),
  mrr: z.coerce.number().min(0),
  activo: z.boolean().optional(),
})
type ClienteForm = z.input<typeof clienteSchema>

interface Props {
  ingresosIniciales: Ingreso[]
  clientesIniciales: Cliente[]
}

export default function IngresosCrud({ ingresosIniciales, clientesIniciales }: Props) {
  const [tab, setTab] = useState<'ingresos' | 'clientes'>('ingresos')
  const [ingresos, setIngresos] = useState<Ingreso[]>(ingresosIniciales)
  const [clientes, setClientes] = useState<Cliente[]>(clientesIniciales)
  const [error, setError] = useState<string | null>(null)

  const clienteNombre = useMemo(() => {
    const m = new Map(clientes.map((c) => [c.id, c.nombre]))
    return (id: string | null) => (id ? m.get(id) ?? '—' : '—')
  }, [clientes])

  const mrrTotal = clientes
    .filter((c) => c.activo)
    .reduce((a, c) => a + (c.mrr || 0), 0)

  const ingresoForm = useForm<IngresoForm>({
    resolver: zodResolver(ingresoSchema),
    defaultValues: { tipo: 'recurrente' },
  })
  const clienteForm = useForm<ClienteForm>({
    resolver: zodResolver(clienteSchema),
    defaultValues: { segmento: 'retail', activo: true },
  })

  async function recargarIngresos() {
    try {
      const supabase = createClient()
      const { data } = await supabase.from('ingresos').select('*')
      if (data) setIngresos(data as Ingreso[])
    } catch {
      /* noop */
    }
  }
  async function recargarClientes() {
    try {
      const supabase = createClient()
      const { data } = await supabase.from('clientes').select('*')
      if (data) setClientes(data as Cliente[])
    } catch {
      /* noop */
    }
  }

  const submitIngreso = ingresoForm.handleSubmit(async (v) => {
    setError(null)
    try {
      const supabase = createClient()
      const fecha = String(v.fecha)
      const d = new Date(fecha)
      const monto = Number(v.monto) || 0
      const { error: err } = await supabase.from('ingresos').insert({
        cliente_id: v.cliente_id || null,
        concepto: v.concepto,
        tipo: v.tipo,
        monto,
        moneda: 'MXN',
        mes: d.getMonth() + 1,
        anio: d.getFullYear(),
        fecha,
        recurrente: !!v.recurrente,
      })
      if (err) {
        setError(err.message)
        return
      }
      ingresoForm.reset({ tipo: 'recurrente' })
      await recargarIngresos()
    } catch {
      setError('No se pudo conectar con la base de datos.')
    }
  })

  const submitCliente = clienteForm.handleSubmit(async (v) => {
    setError(null)
    try {
      const supabase = createClient()
      const { error: err } = await supabase.from('clientes').insert({
        nombre: v.nombre,
        segmento: v.segmento,
        contacto: v.contacto || null,
        mrr: Number(v.mrr) || 0,
        activo: v.activo ?? true,
      })
      if (err) {
        setError(err.message)
        return
      }
      clienteForm.reset({ segmento: 'retail', activo: true })
      await recargarClientes()
    } catch {
      setError('No se pudo conectar con la base de datos.')
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-dark/60">MRR (clientes activos)</p>
          <p className="font-serif text-2xl text-navy">{formatMXN(mrrTotal)}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-dark/60">Clientes activos</p>
          <p className="font-serif text-2xl text-navy">
            {clientes.filter((c) => c.activo).length}
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-dark/60">Ingresos registrados</p>
          <p className="font-serif text-2xl text-navy">{ingresos.length}</p>
        </div>
      </section>

      <div className="flex gap-2 font-sans text-sm">
        <button
          type="button"
          onClick={() => setTab('ingresos')}
          className={`rounded-md px-4 py-2 ${
            tab === 'ingresos' ? 'bg-teal text-white' : 'bg-white text-navy'
          }`}
        >
          Ingresos
        </button>
        <button
          type="button"
          onClick={() => setTab('clientes')}
          className={`rounded-md px-4 py-2 ${
            tab === 'clientes' ? 'bg-teal text-white' : 'bg-white text-navy'
          }`}
        >
          Clientes
        </button>
      </div>

      {error && <p className="font-sans text-sm text-danger">{error}</p>}

      {tab === 'ingresos' ? (
        <div className="flex flex-col gap-4">
          <form
            onSubmit={submitIngreso}
            className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow-sm font-sans text-sm"
          >
            <label className="flex flex-col">
              <span className="text-dark/60">Fecha</span>
              <input type="date" {...ingresoForm.register('fecha')} className="rounded border px-2 py-1" />
            </label>
            <label className="flex flex-col">
              <span className="text-dark/60">Cliente</span>
              <select {...ingresoForm.register('cliente_id')} className="rounded border px-2 py-1">
                <option value="">—</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col">
              <span className="text-dark/60">Concepto / Producto</span>
              <input {...ingresoForm.register('concepto')} className="rounded border px-2 py-1" />
            </label>
            <label className="flex flex-col">
              <span className="text-dark/60">Tipo</span>
              <select {...ingresoForm.register('tipo')} className="rounded border px-2 py-1">
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col">
              <span className="text-dark/60">Monto</span>
              <input type="number" step="0.01" {...ingresoForm.register('monto')} className="rounded border px-2 py-1" />
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...ingresoForm.register('recurrente')} />
              <span className="text-dark/60">Recurrente</span>
            </label>
            <button type="submit" className="rounded-md bg-teal px-4 py-2 font-semibold text-white hover:bg-navy">
              Agregar ingreso
            </button>
          </form>

          <DataTable<Ingreso>
            rows={ingresos}
            sortable
            columns={[
              { key: 'fecha', label: 'Fecha' },
              { key: 'cliente_id', label: 'Cliente', format: (v) => clienteNombre(v as string | null) },
              { key: 'concepto', label: 'Concepto / Producto' },
              {
                key: 'monto',
                label: 'Monto',
                align: 'right',
                format: (v) => formatMXN(Number(v) || 0),
              },
              {
                key: 'recurrente',
                label: 'Recurrente',
                format: (v) =>
                  v ? (
                    <span className="rounded-full bg-ok/15 px-2 py-0.5 text-xs text-ok">Recurrente</span>
                  ) : (
                    <span className="rounded-full bg-dark/10 px-2 py-0.5 text-xs text-dark/60">Único</span>
                  ),
              },
            ]}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <form
            onSubmit={submitCliente}
            className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow-sm font-sans text-sm"
          >
            <label className="flex flex-col">
              <span className="text-dark/60">Nombre</span>
              <input {...clienteForm.register('nombre')} className="rounded border px-2 py-1" />
            </label>
            <label className="flex flex-col">
              <span className="text-dark/60">Segmento / Plan</span>
              <select {...clienteForm.register('segmento')} className="rounded border px-2 py-1">
                {SEGMENTOS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col">
              <span className="text-dark/60">Contacto</span>
              <input {...clienteForm.register('contacto')} className="rounded border px-2 py-1" />
            </label>
            <label className="flex flex-col">
              <span className="text-dark/60">MRR (MXN)</span>
              <input type="number" step="0.01" {...clienteForm.register('mrr')} className="rounded border px-2 py-1" />
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...clienteForm.register('activo')} />
              <span className="text-dark/60">Activo</span>
            </label>
            <button type="submit" className="rounded-md bg-teal px-4 py-2 font-semibold text-white hover:bg-navy">
              Agregar cliente
            </button>
          </form>

          <DataTable<Cliente>
            rows={clientes}
            sortable
            columns={[
              { key: 'nombre', label: 'Nombre' },
              { key: 'segmento', label: 'Segmento / Plan' },
              {
                key: 'mrr',
                label: 'MRR',
                align: 'right',
                format: (v) => formatMXN(Number(v) || 0),
              },
              {
                key: 'activo',
                label: 'Estado',
                format: (v) =>
                  v ? (
                    <span className="rounded-full bg-ok/15 px-2 py-0.5 text-xs text-ok">Activo</span>
                  ) : (
                    <span className="rounded-full bg-danger/15 px-2 py-0.5 text-xs text-danger">Inactivo</span>
                  ),
              },
            ]}
          />
        </div>
      )}
    </div>
  )
}
