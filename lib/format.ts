// Formatting utilities for the Orkesta financial dashboard.

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

/** "$1,234,567" — MXN, no decimals. */
export function formatMXN(n: number): string {
  if (n == null || Number.isNaN(n)) return '$0'
  const rounded = Math.round(n)
  return '$' + rounded.toLocaleString('en-US')
}

/** "12.3%" — expects a ratio where 0.123 => "12.3%". */
export function formatPct(n: number): string {
  if (n == null || Number.isNaN(n)) return '0.0%'
  return (n * 100).toFixed(1) + '%'
}

/** "8.5 meses" — accepts number or the sentinel 'rentable'. */
export function formatMeses(n: number | 'rentable'): string {
  if (n === 'rentable') return 'Rentable'
  if (n == null || Number.isNaN(n)) return '0 meses'
  if (!Number.isFinite(n)) return '∞ meses'
  return n.toFixed(1) + ' meses'
}

/** 1 => "Enero" */
export function mesNombre(mes: number): string {
  return MESES[(mes - 1 + 12) % 12] ?? String(mes)
}
