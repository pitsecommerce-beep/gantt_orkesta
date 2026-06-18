import KpiCard from '@/components/KpiCard'
import ChartLine from '@/components/ChartLine'
import ChartBar from '@/components/ChartBar'
import AlertPanel from '@/components/AlertPanel'
import {
  getMovimientos,
  getIngresos,
  getGastos,
  getConfig,
  getAccionistas,
} from '@/lib/data'
import {
  saldoCaja,
  burnNetoPromedio,
  runway,
  mrr,
  arr,
  margenBruto,
} from '@/lib/kpis'
import { generarAlertas, ordenarPorSeveridad } from '@/lib/alertas'
import { formatMXN, formatMeses, formatPct, mesNombre } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [movimientos, ingresos, gastos, config, accionistas] =
    await Promise.all([
      getMovimientos(),
      getIngresos(),
      getGastos(),
      getConfig(),
      getAccionistas(),
    ])

  const now = new Date()
  const mes = now.getMonth() + 1
  const anio = now.getFullYear()

  const saldo = saldoCaja(movimientos)
  const burnProm = burnNetoPromedio(movimientos)
  const rw = runway(saldo, burnProm)
  const mrrValue = mrr(ingresos, mes, anio)
  const arrValue = arr(mrrValue)

  const ingresosMes = ingresos
    .filter((i) => i.mes === mes && i.anio === anio)
    .reduce((acc, i) => acc + i.monto, 0)
  const cogsMes = gastos
    .filter((g) => g.mes === mes && g.anio === anio && g.es_cogs)
    .reduce((acc, g) => acc + g.monto, 0)
  const margen = margenBruto(ingresosMes, cogsMes)

  // --- Ingresos vs Egresos: last 12 months from movimientos ---------------
  const buckets: { key: string; mes: number; anio: number; ingresos: number; egresos: number }[] =
    []
  for (let i = 11; i >= 0; i--) {
    let m = mes - i
    let a = anio
    while (m <= 0) {
      m += 12
      a -= 1
    }
    buckets.push({ key: `${a}-${m}`, mes: m, anio: a, ingresos: 0, egresos: 0 })
  }
  const bucketMap = new Map(buckets.map((b) => [b.key, b]))
  for (const mv of movimientos) {
    const b = bucketMap.get(`${mv.anio}-${mv.mes}`)
    if (!b) continue
    if (mv.tipo === 'ingreso') b.ingresos += Math.abs(mv.monto)
    else if (mv.tipo === 'egreso') b.egresos += Math.abs(mv.monto)
  }
  const lineData = buckets.map((b) => ({
    mes: mesNombre(b.mes),
    ingresos: b.ingresos,
    egresos: b.egresos,
  }))

  // --- Costos por categoria (gastos del mes actual) -----------------------
  const catMap = new Map<string, number>()
  for (const g of gastos) {
    if (g.mes === mes && g.anio === anio) {
      catMap.set(g.categoria, (catMap.get(g.categoria) ?? 0) + g.monto)
    }
  }
  const barData = Array.from(catMap.entries()).map(([categoria, monto]) => ({
    categoria,
    monto,
  }))

  // --- Alertas -------------------------------------------------------------
  let mesPrev = mes - 1
  let anioPrev = anio
  if (mesPrev <= 0) {
    mesPrev += 12
    anioPrev -= 1
  }
  const gastosCatActual: Record<string, number> = {}
  const gastosCatPrev: Record<string, number> = {}
  for (const g of gastos) {
    if (g.mes === mes && g.anio === anio)
      gastosCatActual[g.categoria] = (gastosCatActual[g.categoria] ?? 0) + g.monto
    if (g.mes === mesPrev && g.anio === anioPrev)
      gastosCatPrev[g.categoria] = (gastosCatPrev[g.categoria] ?? 0) + g.monto
  }
  const margenObjetivo = config?.margen_bruto_objetivo ?? 0.3

  const alertas = ordenarPorSeveridad(
    generarAlertas({
      movimientos,
      accionistas,
      gastosPorCategoriaMesActual: gastosCatActual,
      gastosPorCategoriaMesAnterior: gastosCatPrev,
      ingresosPeriodo: ingresosMes,
      utilidadNetaPeriodo: ingresosMes - cogsMes,
      margenBrutoActual: margen,
      margenObjetivo,
      cajaProyectada: [saldo],
      mesActual: mes,
      anioActual: anio,
    })
  )

  const runwayStatus: 'ok' | 'warn' | 'danger' =
    rw === 'rentable' ? 'ok' : rw < 6 ? 'danger' : rw < 9 ? 'warn' : 'ok'

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-serif text-3xl text-navy">Dashboard</h1>
        <p className="font-sans text-sm text-dark/60">
          {mesNombre(mes)} {anio}
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard title="Saldo en caja" value={formatMXN(saldo)} status="neutral" />
        <KpiCard
          title="Burn neto promedio"
          value={formatMXN(burnProm)}
          subtitle="Últimos 3 meses"
          status={burnProm > 0 ? 'warn' : 'ok'}
        />
        <KpiCard
          title="Runway"
          value={formatMeses(rw)}
          status={runwayStatus}
        />
        <KpiCard title="MRR" value={formatMXN(mrrValue)} status="neutral" />
        <KpiCard title="ARR" value={formatMXN(arrValue)} status="neutral" />
        <KpiCard
          title="Margen bruto"
          value={formatPct(margen)}
          subtitle={`Objetivo ${formatPct(margenObjetivo)}`}
          status={margen >= margenObjetivo ? 'ok' : 'warn'}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartLine
          data={lineData}
          xKey="mes"
          title="Ingresos vs Egresos (12 meses)"
          lines={[
            { key: 'ingresos', label: 'Ingresos', color: '#4A8B8C' },
            { key: 'egresos', label: 'Egresos', color: '#C44536' },
          ]}
        />
        <ChartBar
          data={barData}
          xKey="categoria"
          barKey="monto"
          title="Costos por categoría (mes actual)"
        />
      </section>

      <section>
        <h2 className="font-serif text-xl text-navy mb-3">Alertas</h2>
        <AlertPanel alertas={alertas} />
      </section>
    </div>
  )
}
