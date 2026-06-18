// ============================================================================
// Orkesta Labs — Alert engine. Pure functions over real data.
// ============================================================================

import type { MovimientoCaja, Accionista, Alerta } from './types'
import {
  saldoCaja,
  burnNetoPromedio,
  burnRateNeto,
  runway,
} from './kpis'
import { formatMXN, formatMeses, formatPct, mesNombre } from './format'

export interface AlertasInput {
  movimientos: MovimientoCaja[]
  accionistas: Accionista[]
  /** Gastos del mes actual agrupados por categoría. */
  gastosPorCategoriaMesActual: Record<string, number>
  /** Gastos del mes anterior agrupados por categoría. */
  gastosPorCategoriaMesAnterior: Record<string, number>
  /** Ingresos y utilidad del periodo para evaluar margen. */
  ingresosPeriodo: number
  utilidadNetaPeriodo: number
  margenBrutoActual: number // ratio 0..1
  margenObjetivo: number // ratio 0..1, e.g. 0.30
  /** Proyección de caja para próximos meses (signed balances). */
  cajaProyectada: number[]
  /** Plan vs real para el mes evaluado. */
  planMes?: number
  realMes?: number
  mesActual: number
  anioActual: number
}

export function generarAlertas(input: AlertasInput): Alerta[] {
  const alertas: Alerta[] = []
  const {
    movimientos,
    accionistas,
    gastosPorCategoriaMesActual,
    gastosPorCategoriaMesAnterior,
    ingresosPeriodo,
    utilidadNetaPeriodo,
    margenBrutoActual,
    margenObjetivo,
    cajaProyectada,
    planMes,
    realMes,
    mesActual,
    anioActual,
  } = input

  // 1. Runway crítico
  const saldo = saldoCaja(movimientos)
  const burnProm = burnNetoPromedio(movimientos)
  const rw = runway(saldo, burnProm)
  if (rw !== 'rentable') {
    if (rw < 6) {
      alertas.push({
        id: 'runway-critico',
        severidad: 'danger',
        titulo: 'Runway crítico',
        mensaje: `Quedan ${formatMeses(rw)} de runway con un saldo de ${formatMXN(
          saldo
        )} y burn neto promedio de ${formatMXN(burnProm)}/mes.`,
        vista: false,
      })
    } else if (rw < 9) {
      alertas.push({
        id: 'runway-bajo',
        severidad: 'warn',
        titulo: 'Runway en zona de atención',
        mensaje: `Quedan ${formatMeses(rw)} de runway. Considera asegurar capital o reducir burn.`,
        vista: false,
      })
    }
  }

  // 2. Burn creciente (> 110% del promedio últimos 3 meses)
  const burnActual = burnRateNeto(movimientos, mesActual, anioActual)
  if (burnProm > 0 && burnActual > burnProm * 1.1) {
    alertas.push({
      id: 'burn-creciente',
      severidad: 'warn',
      titulo: 'Burn creciente',
      mensaje: `El burn neto de ${mesNombre(mesActual)} (${formatMXN(
        burnActual
      )}) supera en ${formatPct(
        burnActual / burnProm - 1
      )} el promedio de los últimos 3 meses (${formatMXN(burnProm)}).`,
      vista: false,
    })
  }

  // 3. Costo en alza por categoría (> 15% vs mes anterior)
  for (const [cat, montoActual] of Object.entries(gastosPorCategoriaMesActual)) {
    const montoPrev = gastosPorCategoriaMesAnterior[cat] ?? 0
    if (montoPrev > 0 && montoActual > montoPrev * 1.15) {
      alertas.push({
        id: `costo-alza-${cat}`,
        severidad: 'warn',
        titulo: `Costo en alza: ${cat}`,
        mensaje: `${cat} subió ${formatPct(
          montoActual / montoPrev - 1
        )} vs el mes anterior (${formatMXN(montoPrev)} → ${formatMXN(montoActual)}).`,
        vista: false,
      })
    }
  }

  // 4. Margen bajo objetivo (< 30% cuando hay utilidad positiva)
  if (utilidadNetaPeriodo > 0 && margenBrutoActual < margenObjetivo) {
    alertas.push({
      id: 'margen-bajo',
      severidad: 'warn',
      titulo: 'Margen bajo objetivo',
      mensaje: `El margen bruto actual (${formatPct(
        margenBrutoActual
      )}) está por debajo del objetivo (${formatPct(margenObjetivo)}).`,
      vista: false,
    })
  }

  // 5. Caja negativa proyectada
  const mesNeg = cajaProyectada.findIndex((c) => c < 0)
  if (mesNeg >= 0) {
    alertas.push({
      id: 'caja-negativa',
      severidad: 'danger',
      titulo: 'Caja negativa proyectada',
      mensaje: `La proyección indica saldo de caja negativo en ${mesNeg + 1} mes(es) (${formatMXN(
        cajaProyectada[mesNeg]
      )}). Acción inmediata requerida.`,
      vista: false,
    })
  }

  // 6. Capital sin confirmar
  const sinConfirmar = accionistas.filter((a) => a.por_confirmar)
  if (sinConfirmar.length > 0) {
    const total = sinConfirmar.reduce(
      (acc, a) => acc + (a.capital_comprometido || 0),
      0
    )
    alertas.push({
      id: 'capital-sin-confirmar',
      severidad: 'info',
      titulo: 'Capital sin confirmar',
      mensaje: `${sinConfirmar.length} accionista(s) con datos por confirmar (${formatMXN(
        total
      )} comprometidos). Validar acuerdo de accionistas.`,
      vista: false,
    })
  }

  // 7. Desviación Plan vs Real > 20%
  if (planMes != null && realMes != null && planMes !== 0) {
    const desv = Math.abs(realMes - planMes) / Math.abs(planMes)
    if (desv > 0.2) {
      alertas.push({
        id: 'desviacion-plan',
        severidad: 'warn',
        titulo: 'Desviación Plan vs Real',
        mensaje: `El resultado real (${formatMXN(realMes)}) se desvía ${formatPct(
          desv
        )} del plan (${formatMXN(planMes)}) para ${mesNombre(mesActual)}.`,
        vista: false,
      })
    }
  }

  if (alertas.length === 0) {
    alertas.push({
      id: 'todo-en-orden',
      severidad: 'ok',
      titulo: 'Todo en orden',
      mensaje: 'No se detectaron alertas financieras en este periodo.',
      vista: false,
    })
  }

  return alertas
}

const ORDEN: Record<string, number> = { danger: 0, warn: 1, info: 2, ok: 3 }

export function ordenarPorSeveridad(alertas: Alerta[]): Alerta[] {
  return [...alertas].sort(
    (a, b) => ORDEN[a.severidad] - ORDEN[b.severidad]
  )
}
