'use client'

import { useMemo } from 'react'
import KpiCard from '@/components/KpiCard'
import ChartLine from '@/components/ChartLine'
import ChartBar from '@/components/ChartBar'
import AlertPanel from '@/components/AlertPanel'
import { useTable, useConfig } from '@/lib/useData'
import {
  saldoCaja, burnNetoPromedio, runway, mrr, arr, margenBruto,
} from '@/lib/kpis'
import { generarAlertas, ordenarPorSeveridad } from '@/lib/alertas'
import { formatMXN, formatMeses, formatPct, mesNombre } from '@/lib/format'

export default function DashboardPage() {
  const { data: movimientos, loading: lm } = useTable('movimientos_caja')
  const { data: ingresos, loading: li } = useTable('ingresos')
  const { data: gastos, loading: lg } = useTable('gastos')
  const { data: accionistas } = useTable('accionistas')
  const { config } = useConfig()

  const now = new Date()
  const mes = now.getMonth() + 1
  const anio = now.getFullYear()

  const saldo = useMemo(() => saldoCaja(movimientos), [movimientos])
  const burnProm = useMemo(() => burnNetoPromedio(movimientos), [movimientos])
  const rw = useMemo(() => runway(saldo, burnProm), [saldo, burnProm])
  const mrrValue = useMemo(() => mrr(ingresos, mes, anio), [ingresos, mes, anio])
  const arrValue = useMemo(() => arr(mrrValue), [mrrValue])

  const ingresosMes = useMemo(() =>
    ingresos.filter(i => i.mes === mes && i.anio === anio).reduce((a, i) => a + i.monto, 0),
    [ingresos, mes, anio])
  const cogsMes = useMemo(() =>
    gastos.filter(g => g.mes === mes && g.anio === anio && g.es_cogs).reduce((a, g) => a + g.monto, 0),
    [gastos, mes, anio])
  const margen = margenBruto(ingresosMes, cogsMes)
  const margenObjetivo = config?.margen_bruto_objetivo ?? 0.3

  const lineData = useMemo(() => {
    const buckets = []
    for (let i = 11; i >= 0; i--) {
      let m = mes - i, a = anio
      while (m <= 0) { m += 12; a -= 1 }
      buckets.push({ key: `${a}-${m}`, mes: m, anio: a, ingresos: 0, egresos: 0 })
    }
    const bMap = new Map(buckets.map(b => [b.key, b]))
    for (const mv of movimientos) {
      const b = bMap.get(`${mv.anio}-${mv.mes}`)
      if (!b) continue
      if (mv.tipo === 'ingreso') b.ingresos += Math.abs(mv.monto)
      else if (mv.tipo === 'egreso') b.egresos += Math.abs(mv.monto)
    }
    return buckets.map(b => ({ mes: mesNombre(b.mes), ingresos: b.ingresos, egresos: b.egresos }))
  }, [movimientos, mes, anio])

  const barData = useMemo(() => {
    const catMap = new Map<string, number>()
    for (const g of gastos) {
      if (g.mes === mes && g.anio === anio)
        catMap.set(g.categoria, (catMap.get(g.categoria) ?? 0) + g.monto)
    }
    return Array.from(catMap.entries()).map(([categoria, monto]) => ({ categoria, monto }))
  }, [gastos, mes, anio])

  const alertas = useMemo(() => {
    let mesPrev = mes - 1, anioPrev = anio
    if (mesPrev <= 0) { mesPrev += 12; anioPrev -= 1 }
    const actual: Record<string, number> = {}
    const prev: Record<string, number> = {}
    for (const g of gastos) {
      if (g.mes === mes && g.anio === anio) actual[g.categoria] = (actual[g.categoria] ?? 0) + g.monto
      if (g.mes === mesPrev && g.anio === anioPrev) prev[g.categoria] = (prev[g.categoria] ?? 0) + g.monto
    }
    return ordenarPorSeveridad(generarAlertas({
      movimientos, accionistas,
      gastosPorCategoriaMesActual: actual,
      gastosPorCategoriaMesAnterior: prev,
      ingresosPeriodo: ingresosMes,
      utilidadNetaPeriodo: ingresosMes - cogsMes,
      margenBrutoActual: margen,
      margenObjetivo,
      cajaProyectada: [saldo],
      mesActual: mes, anioActual: anio,
    }))
  }, [movimientos, gastos, accionistas, ingresosMes, cogsMes, margen, margenObjetivo, saldo, mes, anio])

  const runwayStatus: 'ok' | 'warn' | 'danger' =
    rw === 'rentable' ? 'ok' : rw < 6 ? 'danger' : rw < 9 ? 'warn' : 'ok'

  const loading = lm || li || lg

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-serif text-3xl text-navy">Dashboard</h1>
        <p className="text-sm text-dark/60">{mesNombre(mes)} {anio}</p>
      </header>

      {loading ? (
        <div className="text-dark/40 animate-pulse py-8 text-center">Cargando datos…</div>
      ) : (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <KpiCard title="Saldo en caja" value={formatMXN(saldo)} status="neutral" />
            <KpiCard title="Burn neto promedio" value={formatMXN(burnProm)} subtitle="Últimos 3 meses" status={burnProm > 0 ? 'warn' : 'ok'} />
            <KpiCard title="Runway" value={formatMeses(rw)} status={runwayStatus} />
            <KpiCard title="MRR" value={formatMXN(mrrValue)} status="neutral" />
            <KpiCard title="ARR" value={formatMXN(arrValue)} status="neutral" />
            <KpiCard title="Margen bruto" value={formatPct(margen)} subtitle={`Objetivo ${formatPct(margenObjetivo)}`} status={margen >= margenObjetivo ? 'ok' : 'warn'} />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartLine data={lineData} xKey="mes" title="Ingresos vs Egresos (12 meses)"
              lines={[{ key: 'ingresos', label: 'Ingresos', color: '#4A8B8C' }, { key: 'egresos', label: 'Egresos', color: '#C44536' }]} />
            <ChartBar data={barData} xKey="categoria" barKey="monto" title="Costos por categoría (mes actual)" />
          </section>

          <section>
            <h2 className="font-serif text-xl text-navy mb-3">Alertas</h2>
            <AlertPanel alertas={alertas} />
          </section>
        </>
      )}
    </div>
  )
}
