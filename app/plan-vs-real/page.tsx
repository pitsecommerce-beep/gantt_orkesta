'use client'

import { useMemo } from 'react'
import { useTable } from '@/lib/useData'
import { formatMXN, mesNombre } from '@/lib/format'

function desviacion(plan: number, real: number) {
  if (plan === 0) return null
  return (real - plan) / Math.abs(plan)
}

function DesvCell({ pct }: { pct: number | null }) {
  if (pct === null) return <td className="px-3 py-2 text-center text-dark/30 text-sm">—</td>
  const abs = Math.abs(pct)
  const color = abs <= 0.05 ? 'text-ok' : abs <= 0.20 ? 'text-warn' : 'text-danger'
  return <td className={`px-3 py-2 text-center text-sm font-medium ${color}`}>{pct >= 0 ? '+' : ''}{(pct * 100).toFixed(1)}%</td>
}

export default function PlanVsRealPage() {
  const { data: ingresos, loading: li } = useTable('ingresos')
  const { data: gastos, loading: lg } = useTable('gastos')
  const { data: planMensual, loading: lp } = useTable('plan_mensual')

  const rows = useMemo(() => planMensual.slice(0, 12).map(plan => {
    const ingresosReal = ingresos.filter(i => i.mes === plan.mes && i.anio === plan.anio).reduce((a, i) => a + i.monto, 0)
    const cogsReal = gastos.filter(g => g.mes === plan.mes && g.anio === plan.anio && g.es_cogs).reduce((a, g) => a + g.monto, 0)
    const opexReal = gastos.filter(g => g.mes === plan.mes && g.anio === plan.anio && !g.es_cogs).reduce((a, g) => a + g.monto, 0)
    return {
      label: `${mesNombre(plan.mes)} ${plan.anio}`,
      ingresosPlan: plan.ingresos_plan, ingresosReal,
      opexPlan: plan.opex_plan, opexReal,
      utilidadNetaPlan: plan.utilidad_neta_plan, utilidadNetaReal: ingresosReal - cogsReal - opexReal,
    }
  }), [planMensual, ingresos, gastos])

  const loading = li || lg || lp

  return (
    <div className="p-8">
      <h1 className="font-serif text-3xl text-navy mb-2">Plan vs. Real</h1>
      <p className="text-dark/60 mb-8">Comparación mensual contra proyección v3 (escenario P50)</p>

      {loading ? (
        <div className="animate-pulse text-dark/40 py-8 text-center">Cargando datos…</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-navy text-white">
                  <th className="px-3 py-3 text-left font-medium">Mes</th>
                  <th className="px-3 py-3 text-right font-medium">Ing. Plan</th>
                  <th className="px-3 py-3 text-right font-medium">Ing. Real</th>
                  <th className="px-3 py-3 text-center font-medium">Desv.</th>
                  <th className="px-3 py-3 text-right font-medium">OPEX Plan</th>
                  <th className="px-3 py-3 text-right font-medium">OPEX Real</th>
                  <th className="px-3 py-3 text-center font-medium">Desv.</th>
                  <th className="px-3 py-3 text-right font-medium">Ut. Neta Plan</th>
                  <th className="px-3 py-3 text-right font-medium">Ut. Neta Real</th>
                  <th className="px-3 py-3 text-center font-medium">Desv.</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? 'bg-white' : 'bg-sand'}>
                    <td className="px-3 py-2 font-medium text-navy">{row.label}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatMXN(row.ingresosPlan)}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatMXN(row.ingresosReal)}</td>
                    <DesvCell pct={desviacion(row.ingresosPlan, row.ingresosReal)} />
                    <td className="px-3 py-2 text-right font-mono">{formatMXN(row.opexPlan)}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatMXN(row.opexReal)}</td>
                    <DesvCell pct={desviacion(row.opexPlan, row.opexReal)} />
                    <td className={`px-3 py-2 text-right font-mono ${row.utilidadNetaPlan < 0 ? 'text-danger' : 'text-ok'}`}>{formatMXN(row.utilidadNetaPlan)}</td>
                    <td className={`px-3 py-2 text-right font-mono ${row.utilidadNetaReal < 0 ? 'text-danger' : 'text-ok'}`}>{formatMXN(row.utilidadNetaReal)}</td>
                    <DesvCell pct={desviacion(row.utilidadNetaPlan, row.utilidadNetaReal)} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex gap-6 text-xs text-dark/50">
            <span><span className="text-ok font-bold">■</span> &lt;5%</span>
            <span><span className="text-warn font-bold">■</span> 5–20%</span>
            <span><span className="text-danger font-bold">■</span> &gt;20%</span>
          </div>
        </>
      )}
    </div>
  )
}
