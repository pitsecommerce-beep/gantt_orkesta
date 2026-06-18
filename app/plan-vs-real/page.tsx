import { getIngresos, getGastos, getPlanMensual } from '@/lib/data'
import { formatMXN, mesNombre } from '@/lib/format'

export const dynamic = 'force-dynamic'

function desviacion(plan: number, real: number) {
  if (plan === 0) return null
  return (real - plan) / Math.abs(plan)
}

function DesvCell({ pct }: { pct: number | null }) {
  if (pct === null) return <td className="px-3 py-2 text-center text-dark/30 text-sm">—</td>
  const abs = Math.abs(pct)
  const color = abs <= 0.05 ? 'text-ok' : abs <= 0.20 ? 'text-warn' : 'text-danger'
  const sign = pct >= 0 ? '+' : ''
  return (
    <td className={`px-3 py-2 text-center text-sm font-medium ${color}`}>
      {sign}{(pct * 100).toFixed(1)}%
    </td>
  )
}

export default async function PlanVsRealPage() {
  const [ingresos, gastos, planMensual] = await Promise.all([
    getIngresos(),
    getGastos(),
    getPlanMensual(),
  ])

  const meses = planMensual.slice(0, 12)

  const rows = meses.map((plan) => {
    const ingresosReal = ingresos
      .filter((i) => i.mes === plan.mes && i.anio === plan.anio)
      .reduce((acc, i) => acc + i.monto, 0)

    const cogsReal = gastos
      .filter((g) => g.mes === plan.mes && g.anio === plan.anio && g.es_cogs)
      .reduce((acc, g) => acc + g.monto, 0)

    const opexReal = gastos
      .filter((g) => g.mes === plan.mes && g.anio === plan.anio && !g.es_cogs)
      .reduce((acc, g) => acc + g.monto, 0)

    const utilidadNetaReal = ingresosReal - cogsReal - opexReal

    return {
      label: `${mesNombre(plan.mes)} ${plan.anio}`,
      ingresosPlan: plan.ingresos_plan,
      ingresosReal,
      cogsPlan: plan.cogs_plan,
      cogsReal,
      opexPlan: plan.opex_plan,
      opexReal,
      utilidadNetaPlan: plan.utilidad_neta_plan,
      utilidadNetaReal,
    }
  })

  return (
    <div className="p-8">
      <h1 className="font-serif text-3xl text-navy mb-2">Plan vs. Real</h1>
      <p className="text-dark/60 mb-8">Comparación mensual contra proyección v3 (escenario P50)</p>

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
                <td className={`px-3 py-2 text-right font-mono ${row.utilidadNetaPlan < 0 ? 'text-danger' : 'text-ok'}`}>
                  {formatMXN(row.utilidadNetaPlan)}
                </td>
                <td className={`px-3 py-2 text-right font-mono ${row.utilidadNetaReal < 0 ? 'text-danger' : 'text-ok'}`}>
                  {formatMXN(row.utilidadNetaReal)}
                </td>
                <DesvCell pct={desviacion(row.utilidadNetaPlan, row.utilidadNetaReal)} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex gap-4 text-xs text-dark/50">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-ok inline-block" /> &lt;5% desviación</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-warn inline-block" /> 5–20% desviación</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-danger inline-block" /> &gt;20% desviación</span>
      </div>
    </div>
  )
}
