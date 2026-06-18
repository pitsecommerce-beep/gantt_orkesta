'use client'

import { useMemo, useState } from 'react'
import { formatMXN, formatPct, mesNombre } from '@/lib/format'
import type { PlanMensual, Ingreso, Gasto } from '@/lib/types'

interface Props {
  plan: PlanMensual[]
  ingresos: Ingreso[]
  gastos: Gasto[]
}

interface LineComparison {
  label: string
  plan: number
  real: number
}

function key(mes: number, anio: number) {
  return `${anio}-${String(mes).padStart(2, '0')}`
}

function devColor(plan: number, real: number): string {
  if (plan === 0) return real === 0 ? 'text-ok' : 'text-danger'
  const dev = Math.abs((real - plan) / plan)
  if (dev <= 0.05) return 'text-ok'
  if (dev <= 0.2) return 'text-warn'
  return 'text-danger'
}

export default function PlanVsRealView({ plan, ingresos, gastos }: Props) {
  const periodos = useMemo(() => {
    const set = new Set<string>()
    plan.forEach((p) => set.add(key(p.mes, p.anio)))
    ingresos.forEach((i) => set.add(key(i.mes, i.anio)))
    gastos.forEach((g) => set.add(key(g.mes, g.anio)))
    return Array.from(set).sort()
  }, [plan, ingresos, gastos])

  const [periodo, setPeriodo] = useState<string>(
    periodos[periodos.length - 1] ?? ''
  )

  const rows = useMemo<LineComparison[]>(() => {
    if (!periodo) return []
    const [anioStr, mesStr] = periodo.split('-')
    const anio = Number(anioStr)
    const mes = Number(mesStr)

    const p = plan.find((x) => x.mes === mes && x.anio === anio)
    const ingPlan = p?.ingresos_plan ?? 0
    const cogsPlan = p?.cogs_plan ?? 0
    const opexPlan = p?.opex_plan ?? 0
    const ubPlan = ingPlan - cogsPlan
    const unPlan = p?.utilidad_neta_plan ?? ubPlan - opexPlan

    const ingReal = ingresos
      .filter((i) => i.mes === mes && i.anio === anio)
      .reduce((a, i) => a + (i.monto || 0), 0)
    const gastosMes = gastos.filter((g) => g.mes === mes && g.anio === anio)
    const cogsReal = gastosMes
      .filter((g) => g.es_cogs)
      .reduce((a, g) => a + (g.monto || 0), 0)
    const opexReal = gastosMes
      .filter((g) => !g.es_cogs)
      .reduce((a, g) => a + (g.monto || 0), 0)
    const ubReal = ingReal - cogsReal
    const unReal = ubReal - opexReal

    return [
      { label: 'Ingresos', plan: ingPlan, real: ingReal },
      { label: 'COGS', plan: cogsPlan, real: cogsReal },
      { label: 'Utilidad Bruta', plan: ubPlan, real: ubReal },
      { label: 'OPEX', plan: opexPlan, real: opexReal },
      { label: 'Utilidad Neta', plan: unPlan, real: unReal },
    ]
  }, [periodo, plan, ingresos, gastos])

  async function exportarExcel() {
    const ExcelJS = (await import('exceljs')).default
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Plan vs Real')
    ws.columns = [
      { header: 'Concepto', key: 'label', width: 22 },
      { header: 'Plan', key: 'plan', width: 16 },
      { header: 'Real', key: 'real', width: 16 },
      { header: 'Desv. $', key: 'desv', width: 16 },
      { header: 'Desv. %', key: 'pct', width: 12 },
    ]
    ws.getRow(1).eachCell((c) => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B3A4B' } }
      c.font = { color: { argb: 'FFFFFFFF' }, bold: true }
    })
    rows.forEach((r) => {
      ws.addRow({
        label: r.label,
        plan: r.plan,
        real: r.real,
        desv: r.real - r.plan,
        pct: r.plan ? (r.real - r.plan) / r.plan : 0,
      })
    })
    const buf = await wb.xlsx.writeBuffer()
    const blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `plan_vs_real_${periodo || 'periodo'}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3 font-sans text-sm">
        <label className="flex flex-col">
          <span className="text-dark/60">Periodo</span>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="rounded border px-2 py-1"
          >
            {periodos.length === 0 ? <option value="">Sin datos</option> : null}
            {periodos.map((p) => {
              const [a, m] = p.split('-')
              return (
                <option key={p} value={p}>
                  {mesNombre(Number(m))} {a}
                </option>
              )
            })}
          </select>
        </label>
        <button
          type="button"
          onClick={exportarExcel}
          className="rounded-md bg-teal px-4 py-2 font-semibold text-white hover:bg-navy"
        >
          Exportar Excel
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg shadow-sm">
        <table className="w-full border-collapse font-sans text-sm">
          <thead>
            <tr className="bg-navy text-white">
              <th className="px-3 py-2 text-left">Concepto</th>
              <th className="px-3 py-2 text-right">Plan</th>
              <th className="px-3 py-2 text-right">Real</th>
              <th className="px-3 py-2 text-right">Desv. $</th>
              <th className="px-3 py-2 text-right">Desv. %</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-dark/60">
                  Sin datos para el periodo seleccionado.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => {
                const desv = r.real - r.plan
                const pct = r.plan ? (r.real - r.plan) / r.plan : 0
                const color = devColor(r.plan, r.real)
                return (
                  <tr key={r.label} className={i % 2 === 0 ? 'bg-white' : 'bg-sand'}>
                    <td className="px-3 py-2 font-medium text-navy">{r.label}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatMXN(r.plan)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatMXN(r.real)}</td>
                    <td className={`px-3 py-2 text-right tabular-nums ${color}`}>{formatMXN(desv)}</td>
                    <td className={`px-3 py-2 text-right tabular-nums ${color}`}>{formatPct(pct)}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
