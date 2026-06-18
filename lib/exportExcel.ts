// ============================================================================
// Orkesta Labs — Excel export (client-side, exceljs).
// ============================================================================

import ExcelJS from 'exceljs'
import type { Gasto, Ingreso, BalanceGeneral, Alerta } from './types'

// ----------------------------------------------------------------------------
// Shared export data shape (consumed by both exportExcel and exportPdf).
// ----------------------------------------------------------------------------

export interface KpiItem {
  label: string
  value: string | number
}

export interface PLData {
  ingresos: number
  cogs: number
  utilidadBruta: number
  opex: number
  ebitda: number
  depreciacion: number
  isr: number
  ptu: number
  utilidadNeta: number
}

export interface PlanVsRealRow {
  mes: number
  anio: number
  ingresosPlan: number
  ingresosReal: number
  opexPlan: number
  opexReal: number
  desviacion: number
}

export interface ExportData {
  kpis: KpiItem[] | Record<string, string | number>
  pl: PLData
  gastos: Gasto[]
  ingresos: Ingreso[]
  balance: BalanceGeneral
  planVsReal: PlanVsRealRow[]
  alertas?: Alerta[]
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

const NAVY = 'FF1B3A4B'
const MONEY_FMT = '$#,##0'

function styleHeader(row: ExcelJS.Row): void {
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: NAVY },
    }
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true }
  })
}

function normalizeKpis(
  kpis: KpiItem[] | Record<string, string | number>
): KpiItem[] {
  if (Array.isArray(kpis)) return kpis
  return Object.entries(kpis).map(([label, value]) => ({ label, value }))
}

// ----------------------------------------------------------------------------
// Main export
// ----------------------------------------------------------------------------

export async function exportarExcel(
  data: ExportData,
  periodo: string
): Promise<void> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Orkesta Labs'
  wb.created = new Date()

  // --- Dashboard KPIs ------------------------------------------------------
  const wsKpis = wb.addWorksheet('Dashboard KPIs')
  wsKpis.columns = [
    { header: 'Indicador', key: 'label', width: 40 },
    { header: 'Valor', key: 'value', width: 24 },
  ]
  styleHeader(wsKpis.getRow(1))
  for (const kpi of normalizeKpis(data.kpis)) {
    wsKpis.addRow({ label: kpi.label, value: kpi.value })
  }

  // --- P&L -----------------------------------------------------------------
  const wsPl = wb.addWorksheet('P&L')
  wsPl.columns = [
    { header: 'Concepto', key: 'concepto', width: 36 },
    { header: 'Monto', key: 'monto', width: 20 },
  ]
  styleHeader(wsPl.getRow(1))
  const plRows: Array<[string, number]> = [
    ['Ingresos', data.pl.ingresos],
    ['COGS', data.pl.cogs],
    ['Utilidad Bruta', data.pl.utilidadBruta],
    ['OPEX', data.pl.opex],
    ['EBITDA', data.pl.ebitda],
    ['Depreciación', data.pl.depreciacion],
    ['ISR', data.pl.isr],
    ['PTU', data.pl.ptu],
    ['Utilidad Neta', data.pl.utilidadNeta],
  ]
  for (const [concepto, monto] of plRows) {
    const row = wsPl.addRow({ concepto, monto })
    row.getCell('monto').numFmt = MONEY_FMT
  }

  // --- Gastos --------------------------------------------------------------
  const wsGastos = wb.addWorksheet('Gastos')
  wsGastos.columns = [
    { header: 'Concepto', key: 'concepto', width: 32 },
    { header: 'Categoría', key: 'categoria', width: 20 },
    { header: 'Proveedor', key: 'proveedor', width: 22 },
    { header: 'Monto', key: 'monto', width: 16 },
    { header: 'Moneda', key: 'moneda', width: 10 },
    { header: 'Mes', key: 'mes', width: 8 },
    { header: 'Año', key: 'anio', width: 10 },
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'COGS', key: 'es_cogs', width: 10 },
  ]
  styleHeader(wsGastos.getRow(1))
  for (const g of data.gastos) {
    const row = wsGastos.addRow({
      concepto: g.concepto,
      categoria: g.categoria,
      proveedor: g.proveedor ?? '',
      monto: g.monto,
      moneda: g.moneda,
      mes: g.mes,
      anio: g.anio,
      fecha: g.fecha,
      es_cogs: g.es_cogs ? 'Sí' : 'No',
    })
    row.getCell('monto').numFmt = MONEY_FMT
  }

  // --- Ingresos ------------------------------------------------------------
  const wsIngresos = wb.addWorksheet('Ingresos')
  wsIngresos.columns = [
    { header: 'Concepto', key: 'concepto', width: 32 },
    { header: 'Tipo', key: 'tipo', width: 16 },
    { header: 'Monto', key: 'monto', width: 16 },
    { header: 'Moneda', key: 'moneda', width: 10 },
    { header: 'Mes', key: 'mes', width: 8 },
    { header: 'Año', key: 'anio', width: 10 },
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'Recurrente', key: 'recurrente', width: 12 },
  ]
  styleHeader(wsIngresos.getRow(1))
  for (const i of data.ingresos) {
    const row = wsIngresos.addRow({
      concepto: i.concepto,
      tipo: i.tipo,
      monto: i.monto,
      moneda: i.moneda,
      mes: i.mes,
      anio: i.anio,
      fecha: i.fecha,
      recurrente: i.recurrente ? 'Sí' : 'No',
    })
    row.getCell('monto').numFmt = MONEY_FMT
  }

  // --- Balance -------------------------------------------------------------
  const wsBalance = wb.addWorksheet('Balance')
  wsBalance.columns = [
    { header: 'Cuenta', key: 'cuenta', width: 40 },
    { header: 'Monto', key: 'monto', width: 20 },
  ]
  styleHeader(wsBalance.getRow(1))
  const b = data.balance
  const balanceRows: Array<[string, number]> = [
    ['ACTIVOS', NaN],
    ['Caja', b.activos.caja],
    ['Cuentas por Cobrar', b.activos.cuentasPorCobrar],
    ['Equipo Bruto', b.activos.equipoBruto],
    ['Depreciación Acumulada', b.activos.depreciacionAcumulada],
    ['Equipo Neto', b.activos.equipoNeto],
    ['Total Activos', b.activos.totalActivos],
    ['PASIVOS', NaN],
    ['Cuentas por Pagar', b.pasivos.cuentasPorPagar],
    ['Impuestos por Pagar', b.pasivos.impuestosPorPagar],
    ['Total Pasivos', b.pasivos.totalPasivos],
    ['CAPITAL', NaN],
    ['Capital Social', b.capital.capitalSocial],
    ['Reserva Legal', b.capital.reservaLegal],
    ['Utilidades Acumuladas', b.capital.utilidadesAcumuladas],
    ['Total Capital', b.capital.totalCapital],
    ['Diferencia', b.diferencia],
  ]
  for (const [cuenta, monto] of balanceRows) {
    if (Number.isNaN(monto)) {
      const headerRow = wsBalance.addRow({ cuenta, monto: '' })
      styleHeader(headerRow)
    } else {
      const row = wsBalance.addRow({ cuenta, monto })
      row.getCell('monto').numFmt = MONEY_FMT
    }
  }

  // --- Plan vs Real --------------------------------------------------------
  const wsPvr = wb.addWorksheet('Plan vs Real')
  wsPvr.columns = [
    { header: 'Mes', key: 'mes', width: 10 },
    { header: 'Año', key: 'anio', width: 10 },
    { header: 'Ingresos Plan', key: 'ingresosPlan', width: 16 },
    { header: 'Ingresos Real', key: 'ingresosReal', width: 16 },
    { header: 'OPEX Plan', key: 'opexPlan', width: 16 },
    { header: 'OPEX Real', key: 'opexReal', width: 16 },
    { header: 'Desviación', key: 'desviacion', width: 16 },
  ]
  styleHeader(wsPvr.getRow(1))
  for (const p of data.planVsReal) {
    const row = wsPvr.addRow({
      mes: p.mes,
      anio: p.anio,
      ingresosPlan: p.ingresosPlan,
      ingresosReal: p.ingresosReal,
      opexPlan: p.opexPlan,
      opexReal: p.opexReal,
      desviacion: p.desviacion,
    })
    for (const key of [
      'ingresosPlan',
      'ingresosReal',
      'opexPlan',
      'opexReal',
      'desviacion',
    ]) {
      row.getCell(key).numFmt = MONEY_FMT
    }
  }

  // --- Download ------------------------------------------------------------
  const buffer = await wb.xlsx.writeBuffer()
  if (typeof window !== 'undefined') {
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orkesta_${periodo}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}
