// ============================================================================
// Orkesta Labs — KPI pure functions.
// All calculations run on REAL data (movimientos_caja, ingresos, gastos).
// The plan_mensual table is NOT used here; it is only for plan-vs-real.
// ============================================================================

import type {
  MovimientoCaja,
  Ingreso,
  Accionista,
  AportacionCapital,
  BalanceGeneral,
} from './types'

/** Current cash balance = sum of all cash movements (signed). */
export function saldoCaja(movimientos: MovimientoCaja[]): number {
  return movimientos.reduce((acc, m) => acc + m.monto, 0)
}

/** Gross burn = total outflows (egresos) for a given month. Returns a positive number. */
export function burnRateBruto(
  movimientos: MovimientoCaja[],
  mes: number,
  anio: number
): number {
  return movimientos
    .filter((m) => m.mes === mes && m.anio === anio && m.tipo === 'egreso')
    .reduce((acc, m) => acc + Math.abs(m.monto), 0)
}

/** Net burn = outflows - operating inflows (ingresos, excludes capital). Positive = burning. */
export function burnRateNeto(
  movimientos: MovimientoCaja[],
  mes: number,
  anio: number
): number {
  const delMes = movimientos.filter((m) => m.mes === mes && m.anio === anio)
  const egresos = delMes
    .filter((m) => m.tipo === 'egreso')
    .reduce((acc, m) => acc + Math.abs(m.monto), 0)
  const ingresos = delMes
    .filter((m) => m.tipo === 'ingreso')
    .reduce((acc, m) => acc + Math.abs(m.monto), 0)
  return egresos - ingresos
}

/** Average net burn over the last 3 CLOSED months (excludes the current month). */
export function burnNetoPromedio(movimientos: MovimientoCaja[]): number {
  const now = new Date()
  const curMes = now.getMonth() + 1
  const curAnio = now.getFullYear()

  const burns: number[] = []
  for (let i = 1; i <= 3; i++) {
    let mes = curMes - i
    let anio = curAnio
    while (mes <= 0) {
      mes += 12
      anio -= 1
    }
    burns.push(burnRateNeto(movimientos, mes, anio))
  }
  if (burns.length === 0) return 0
  return burns.reduce((a, b) => a + b, 0) / burns.length
}

/** Months of runway. Returns 'rentable' if not burning cash. */
export function runway(
  saldo: number,
  burnNetoPromedio: number
): number | 'rentable' {
  if (burnNetoPromedio <= 0) return 'rentable'
  return saldo / burnNetoPromedio
}

/** Monthly Recurring Revenue: sum of recurring revenue for a given month. */
export function mrr(ingresos: Ingreso[], mes: number, anio: number): number {
  return ingresos
    .filter(
      (i) =>
        i.mes === mes &&
        i.anio === anio &&
        (i.recurrente || i.tipo === 'recurrente')
    )
    .reduce((acc, i) => acc + i.monto, 0)
}

/** Annual Recurring Revenue. */
export function arr(mrrValue: number): number {
  return mrrValue * 12
}

/** Gross margin ratio = (ingresos - cogs) / ingresos. */
export function margenBruto(ingresos: number, cogs: number): number {
  if (ingresos === 0) return 0
  return (ingresos - cogs) / ingresos
}

/** EBITDA = utilidadBruta - opex - depreciacion is NOT subtracted here.
 *  EBITDA excludes depreciation by definition: EBITDA = utilidadBruta - opex.
 *  The depreciacion param is accepted for signature completeness/clarity but
 *  added back so EBITDA stays before depreciation. */
export function ebitda(
  utilidadBruta: number,
  opex: number,
  depreciacion: number
): number {
  // opex may already include depreciation; add it back to get EBITDA.
  return utilidadBruta - opex + depreciacion
}

/** Net profit = EBITDA - depreciation - ISR - PTU. */
export function utilidadNeta(
  ebitdaValue: number,
  depreciacion: number,
  isr: number,
  ptu: number
): number {
  return ebitdaValue - depreciacion - isr - ptu
}

/** Net margin ratio. */
export function margenNeto(utilidadNetaValue: number, ingresos: number): number {
  if (ingresos === 0) return 0
  return utilidadNetaValue / ingresos
}

/** Capital aportado vs comprometido across all shareholders. */
export function capitalAportadoVsComprometido(
  accionistas: Accionista[],
  aportaciones: AportacionCapital[]
): {
  comprometido: number
  aportado: number
  pendiente: number
  porcentajeAportado: number
} {
  const comprometido = accionistas.reduce(
    (acc, a) => acc + (a.capital_comprometido || 0),
    0
  )
  const aportadoConfirmado = aportaciones
    .filter((ap) => ap.confirmada)
    .reduce((acc, ap) => acc + ap.monto, 0)
  // Fall back to per-shareholder aportado if no movement rows exist.
  const aportadoAccionistas = accionistas.reduce(
    (acc, a) => acc + (a.capital_aportado || 0),
    0
  )
  const aportado = aportadoConfirmado || aportadoAccionistas
  const pendiente = comprometido - aportado
  return {
    comprometido,
    aportado,
    pendiente,
    porcentajeAportado: comprometido > 0 ? aportado / comprometido : 0,
  }
}

/** Build a balance sheet and check that Activos = Pasivos + Capital. */
export function balanceGeneral(
  caja: number,
  equipoBruto: number,
  depreciacionAcumulada: number,
  cuentasPorCobrar: number,
  cuentasPorPagar: number,
  impuestosPorPagar: number,
  capitalSocial: number,
  reservaLegal: number,
  utilidadesAcumuladas: number
): BalanceGeneral {
  const equipoNeto = equipoBruto - depreciacionAcumulada
  const totalActivos = caja + cuentasPorCobrar + equipoNeto
  const totalPasivos = cuentasPorPagar + impuestosPorPagar
  const totalCapital = capitalSocial + reservaLegal + utilidadesAcumuladas
  const diferencia = totalActivos - (totalPasivos + totalCapital)
  return {
    activos: {
      caja,
      cuentasPorCobrar,
      equipoBruto,
      depreciacionAcumulada,
      equipoNeto,
      totalActivos,
    },
    pasivos: {
      cuentasPorPagar,
      impuestosPorPagar,
      totalPasivos,
    },
    capital: {
      capitalSocial,
      reservaLegal,
      utilidadesAcumuladas,
      totalCapital,
    },
    balanceado: Math.abs(diferencia) < 1,
    diferencia,
  }
}
