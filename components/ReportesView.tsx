'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { exportarPdf } from '@/lib/exportPdf'
import { exportarExcel, type ExportData } from '@/lib/exportExcel'
import { balanceGeneral } from '@/lib/kpis'
import { mesNombre } from '@/lib/format'
import type { Gasto, Ingreso, MovimientoCaja, AportacionCapital } from '@/lib/types'

const MESES = Array.from({ length: 12 }, (_, i) => i + 1)
const ANIOS = [2024, 2025, 2026, 2027]

async function fetchAll() {
  const supabase = createClient()
  const [gastos, ingresos, movimientos, aportaciones] = await Promise.all([
    supabase.from('gastos').select('*'),
    supabase.from('ingresos').select('*'),
    supabase.from('movimientos_caja').select('*'),
    supabase.from('aportaciones_capital').select('*'),
  ])
  return {
    gastos: (gastos.data ?? []) as Gasto[],
    ingresos: (ingresos.data ?? []) as Ingreso[],
    movimientos: (movimientos.data ?? []) as MovimientoCaja[],
    aportaciones: (aportaciones.data ?? []) as AportacionCapital[],
  }
}

function buildExportData(d: {
  gastos: Gasto[]
  ingresos: Ingreso[]
  movimientos: MovimientoCaja[]
  aportaciones: AportacionCapital[]
}): ExportData {
  const ingresosTotal = d.ingresos.reduce((a, i) => a + (i.monto || 0), 0)
  const cogs = d.gastos.filter((g) => g.es_cogs).reduce((a, g) => a + (g.monto || 0), 0)
  const opex = d.gastos.filter((g) => !g.es_cogs).reduce((a, g) => a + (g.monto || 0), 0)
  const utilidadBruta = ingresosTotal - cogs
  const ebitda = utilidadBruta - opex
  const utilidadNeta = ebitda

  const caja = d.movimientos.reduce((a, m) => a + (m.monto || 0), 0)
  const equipoBruto = d.gastos
    .filter((g) => g.categoria === 'equipo_computo')
    .reduce((a, g) => a + (g.monto || 0), 0)
  const capitalSocial = d.aportaciones.reduce((a, ap) => a + (ap.monto || 0), 0)
  const totalActivos = caja + equipoBruto
  const utilidadesAcumuladas = totalActivos - capitalSocial
  const balance = balanceGeneral(
    caja,
    equipoBruto,
    0,
    0,
    0,
    0,
    capitalSocial,
    0,
    utilidadesAcumuladas
  )

  return {
    kpis: [
      { label: 'Ingresos', value: ingresosTotal },
      { label: 'COGS', value: cogs },
      { label: 'OPEX', value: opex },
      { label: 'Utilidad Neta', value: utilidadNeta },
      { label: 'Caja', value: caja },
    ],
    pl: {
      ingresos: ingresosTotal,
      cogs,
      utilidadBruta,
      opex,
      ebitda,
      depreciacion: 0,
      isr: 0,
      ptu: 0,
      utilidadNeta,
    },
    gastos: d.gastos,
    ingresos: d.ingresos,
    balance,
    planVsReal: [],
  }
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n')
}

function downloadText(text: string, filename: string, type: string) {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function ReportesView() {
  const now = new Date()
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [anio, setAnio] = useState(now.getFullYear())
  const [csvTabla, setCsvTabla] = useState<'gastos' | 'ingresos'>('gastos')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const periodo = `${mesNombre(mes)}_${anio}`

  async function handlePdf() {
    setError(null)
    setBusy('pdf')
    try {
      const data = buildExportData(await fetchAll())
      await exportarPdf(data, periodo)
    } catch {
      setError('No se pudo generar el PDF.')
    } finally {
      setBusy(null)
    }
  }

  async function handleExcel() {
    setError(null)
    setBusy('excel')
    try {
      const data = buildExportData(await fetchAll())
      await exportarExcel(data, periodo)
    } catch {
      setError('No se pudo generar el Excel.')
    } finally {
      setBusy(null)
    }
  }

  async function handleCsv() {
    setError(null)
    setBusy('csv')
    try {
      const d = await fetchAll()
      const rows = (csvTabla === 'gastos' ? d.gastos : d.ingresos) as unknown as Record<
        string,
        unknown
      >[]
      downloadText(toCsv(rows), `${csvTabla}_${periodo}.csv`, 'text/csv')
    } catch {
      setError('No se pudo generar el CSV.')
    } finally {
      setBusy(null)
    }
  }

  const card = 'flex flex-col gap-3 rounded-lg bg-white p-5 shadow-sm'
  const btn =
    'rounded-md bg-teal px-4 py-2 font-semibold text-white hover:bg-navy disabled:opacity-60'

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow-sm text-sm">
        <label className="flex flex-col">
          <span className="text-dark/60">Mes</span>
          <select
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="rounded border px-2 py-1"
          >
            {MESES.map((m) => (
              <option key={m} value={m}>
                {mesNombre(m)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col">
          <span className="text-dark/60">Año</span>
          <select
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="rounded border px-2 py-1"
          >
            {ANIOS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 text-sm">
        <div className={card}>
          <h3 className="font-serif text-lg text-navy">Reporte Ejecutivo PDF</h3>
          <p className="flex-1 text-dark/60">
            Resumen ejecutivo para el Consejo de Administración.
          </p>
          <button type="button" onClick={handlePdf} disabled={busy !== null} className={btn}>
            {busy === 'pdf' ? 'Generando…' : 'Descargar PDF'}
          </button>
        </div>

        <div className={card}>
          <h3 className="font-serif text-lg text-navy">Libro Financiero Excel</h3>
          <p className="flex-1 text-dark/60">
            P&amp;L, Gastos, Ingresos, Balance, Plan vs Real.
          </p>
          <button type="button" onClick={handleExcel} disabled={busy !== null} className={btn}>
            {busy === 'excel' ? 'Generando…' : 'Descargar Excel'}
          </button>
        </div>

        <div className={card}>
          <h3 className="font-serif text-lg text-navy">Exportar Datos CSV</h3>
          <p className="flex-1 text-dark/60">Exportación simple de datos en crudo.</p>
          <select
            value={csvTabla}
            onChange={(e) => setCsvTabla(e.target.value as 'gastos' | 'ingresos')}
            className="rounded border px-2 py-1"
          >
            <option value="gastos">Gastos</option>
            <option value="ingresos">Ingresos</option>
          </select>
          <button type="button" onClick={handleCsv} disabled={busy !== null} className={btn}>
            {busy === 'csv' ? 'Generando…' : 'Descargar CSV'}
          </button>
        </div>
      </div>
    </div>
  )
}
