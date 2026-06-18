// ============================================================================
// Orkesta Labs — Builds the shared ExportData payload from Supabase (browser).
// Used by the report exporters so callers can pass just a period string.
// ============================================================================

import { createClient } from '@/lib/supabase/client'
import { balanceGeneral } from '@/lib/kpis'
import type {
  ExportData,
} from '@/lib/exportExcel'
import type {
  Gasto,
  Ingreso,
  MovimientoCaja,
  AportacionCapital,
} from '@/lib/types'

/** Accepts "YYYY-MM" (from <input type="month">) and returns {mes, anio} or null. */
function parsePeriodo(periodo: string): { mes: number; anio: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(periodo)
  if (!m) return null
  return { anio: Number(m[1]), mes: Number(m[2]) }
}

export async function fetchExportData(periodo: string): Promise<ExportData> {
  const supabase = createClient()
  const [gastosRes, ingresosRes, movsRes, apsRes] = await Promise.all([
    supabase.from('gastos').select('*'),
    supabase.from('ingresos').select('*'),
    supabase.from('movimientos_caja').select('*'),
    supabase.from('aportaciones_capital').select('*'),
  ])

  const periodoFilter = parsePeriodo(periodo)
  const inPeriodo = <T extends { mes: number; anio: number }>(rows: T[]): T[] =>
    periodoFilter
      ? rows.filter((r) => r.mes === periodoFilter.mes && r.anio === periodoFilter.anio)
      : rows

  const allGastos = (gastosRes.data ?? []) as Gasto[]
  const allIngresos = (ingresosRes.data ?? []) as Ingreso[]
  const movimientos = (movsRes.data ?? []) as MovimientoCaja[]
  const aportaciones = (apsRes.data ?? []) as AportacionCapital[]

  const gastos = inPeriodo(allGastos)
  const ingresos = inPeriodo(allIngresos)

  const ingresosTotal = ingresos.reduce((a, i) => a + (i.monto || 0), 0)
  const cogs = gastos.filter((g) => g.es_cogs).reduce((a, g) => a + (g.monto || 0), 0)
  const opex = gastos.filter((g) => !g.es_cogs).reduce((a, g) => a + (g.monto || 0), 0)
  const utilidadBruta = ingresosTotal - cogs
  const ebitda = utilidadBruta - opex
  const utilidadNeta = ebitda

  const caja = movimientos.reduce((a, m) => a + (m.monto || 0), 0)
  const equipoBruto = allGastos
    .filter((g) => g.categoria === 'equipo_computo')
    .reduce((a, g) => a + (g.monto || 0), 0)
  const depreciacion = equipoBruto * 0.3
  const capitalSocial = aportaciones.reduce((a, ap) => a + (ap.monto || 0), 0)
  const totalActivos = caja + (equipoBruto - depreciacion)
  const utilidadesAcumuladas = totalActivos - capitalSocial

  const balance = balanceGeneral(
    caja,
    equipoBruto,
    depreciacion,
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
      depreciacion,
      isr: 0,
      ptu: 0,
      utilidadNeta,
    },
    gastos,
    ingresos,
    balance,
    planVsReal: [],
  }
}
