// ============================================================================
// Orkesta Labs — PDF export (client-side, @react-pdf/renderer).
// This is a .ts file, so the document tree is built with React.createElement
// rather than JSX.
// ============================================================================

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Circle,
  Path,
  pdf,
} from '@react-pdf/renderer'
import type { ExportData, KpiItem } from './exportExcel'
import { formatMXN } from './format'

const h = React.createElement

const NAVY = '#1B3A4B'
const TEAL = '#4A8B8C'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    padding: 36,
    fontSize: 10,
    color: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brand: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    marginLeft: 12,
  },
  rule: {
    height: 3,
    backgroundColor: TEAL,
    marginTop: 10,
    marginBottom: 18,
  },
  periodo: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    marginTop: 12,
    marginBottom: 8,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  kpiCard: {
    width: '33.33%',
    padding: 6,
  },
  kpiCardInner: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    padding: 8,
  },
  kpiLabel: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
  },
  alertRow: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 2,
    marginRight: 6,
  },
  alertTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  alertMsg: {
    fontSize: 8,
    color: '#444444',
  },
  table: {
    marginTop: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingVertical: 4,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  thLabel: {
    flex: 2,
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  thValue: {
    flex: 1,
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    textAlign: 'right',
  },
  tdLabel: {
    flex: 2,
    fontSize: 9,
    paddingHorizontal: 4,
  },
  tdValue: {
    flex: 1,
    fontSize: 9,
    textAlign: 'right',
    paddingHorizontal: 4,
  },
})

const SEVERITY_COLOR: Record<string, string> = {
  ok: '#2E7D32',
  warn: '#ED6C02',
  danger: '#C62828',
  info: TEAL,
}

function normalizeKpis(
  kpis: KpiItem[] | Record<string, string | number>
): KpiItem[] {
  if (Array.isArray(kpis)) return kpis
  return Object.entries(kpis).map(([label, value]) => ({ label, value }))
}

function Logo() {
  return h(
    Svg,
    { width: 40, height: 40, viewBox: '0 0 64 64' },
    h(Circle, { cx: 32, cy: 32, r: 30, fill: NAVY }),
    h(Path, {
      d: 'M32 12c-11 0-20 9-20 20s9 20 20 20c8 0 14.8-4.7 17.8-11.4',
      stroke: 'white',
      strokeWidth: 5,
      fill: 'none',
    }),
    h(Circle, { cx: 44, cy: 18, r: 3.5, fill: 'white' })
  )
}

function buildDocument(data: ExportData, periodo: string) {
  const kpis = normalizeKpis(data.kpis)

  // Header
  const header = h(
    View,
    null,
    h(View, { style: styles.header }, h(Logo), h(Text, { style: styles.brand }, 'Orkesta Labs')),
    h(View, { style: styles.rule }),
    h(Text, { style: styles.periodo }, `Reporte ejecutivo · Periodo ${periodo}`)
  )

  // KPI grid
  const kpiCards = kpis.map((kpi, idx) =>
    h(
      View,
      { style: styles.kpiCard, key: `kpi-${idx}` },
      h(
        View,
        { style: styles.kpiCardInner },
        h(Text, { style: styles.kpiLabel }, kpi.label),
        h(Text, { style: styles.kpiValue }, String(kpi.value))
      )
    )
  )
  const kpiSection = h(
    View,
    null,
    h(Text, { style: styles.sectionTitle }, 'Indicadores principales'),
    h(View, { style: styles.kpiGrid }, ...kpiCards)
  )

  // Alerts
  const alertas = data.alertas ?? []
  const alertSection =
    alertas.length > 0
      ? h(
          View,
          null,
          h(Text, { style: styles.sectionTitle }, 'Resumen de alertas'),
          ...alertas.map((a, idx) =>
            h(
              View,
              { style: styles.alertRow, key: `alert-${idx}` },
              h(View, {
                style: [
                  styles.alertDot,
                  { backgroundColor: SEVERITY_COLOR[a.severidad] ?? TEAL },
                ],
              }),
              h(
                View,
                { style: { flex: 1 } },
                h(Text, { style: styles.alertTitle }, a.titulo),
                h(Text, { style: styles.alertMsg }, a.mensaje)
              )
            )
          )
        )
      : null

  // P&L summary table
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
  const plSection = h(
    View,
    null,
    h(Text, { style: styles.sectionTitle }, 'Estado de resultados (P&L)'),
    h(
      View,
      { style: styles.table },
      h(
        View,
        { style: styles.tableHeaderRow },
        h(Text, { style: styles.thLabel }, 'Concepto'),
        h(Text, { style: styles.thValue }, 'Monto')
      ),
      ...plRows.map(([label, value], idx) =>
        h(
          View,
          { style: styles.tableRow, key: `pl-${idx}` },
          h(Text, { style: styles.tdLabel }, label),
          h(Text, { style: styles.tdValue }, formatMXN(value))
        )
      )
    )
  )

  return h(
    Document,
    null,
    h(
      Page,
      { size: 'A4', style: styles.page },
      header,
      kpiSection,
      alertSection,
      plSection
    )
  )
}

export async function exportarPdf(
  dataOrPeriodo: ExportData | string,
  periodoArg?: string
): Promise<void> {
  let data: ExportData
  let periodo: string
  if (typeof dataOrPeriodo === 'string') {
    periodo = dataOrPeriodo
    const { fetchExportData } = await import('./reportData')
    data = await fetchExportData(periodo)
  } else {
    data = dataOrPeriodo
    periodo = periodoArg ?? ''
  }

  const doc = buildDocument(data, periodo)
  const blob = await pdf(doc).toBlob()
  if (typeof window !== 'undefined') {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orkesta_reporte_${periodo}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}
