'use client'

import { useMemo } from 'react'
import DataTable from '@/components/DataTable'
import CostosCrud from '@/components/CostosCrud'
import { useTable, useConfig } from '@/lib/useData'
import { formatMXN } from '@/lib/format'
import type { CostoFijo } from '@/lib/types'

type CostoRow = CostoFijo & { montoMxn: number }

export default function CostosPage() {
  const { data: costos, loading } = useTable('costos_fijos')
  const { config } = useConfig()

  const tc = config?.tipo_cambio_mxn_usd ?? 19

  const rows: CostoRow[] = useMemo(() =>
    costos.map(c => ({ ...c, montoMxn: c.moneda === 'USD' ? c.monto * tc : c.monto })),
    [costos, tc])

  const totalMensual = rows
    .filter(c => c.activo && c.recurrente)
    .reduce((acc, c) => acc + c.montoMxn, 0)

  return (
    <div className="p-8 flex flex-col gap-6">
      <header>
        <h1 className="font-serif text-3xl text-navy">Costos Fijos</h1>
        <p className="text-sm text-dark/60 mt-1">Tipo de cambio: ${tc} MXN/USD</p>
      </header>

      <div className="bg-white border-t-[3px] border-teal rounded-lg p-4 shadow-sm max-w-xs">
        <p className="text-xs text-dark/50 uppercase tracking-wide">Total mensual recurrente</p>
        <p className="font-serif text-2xl text-navy mt-1">{formatMXN(totalMensual)}</p>
        <p className="text-xs text-dark/40 mt-1">Anual: {formatMXN(totalMensual * 12)}</p>
      </div>

      {loading ? (
        <div className="animate-pulse text-dark/40 py-8 text-center">Cargando costos…</div>
      ) : (
        <>
          <DataTable<CostoRow>
            rows={rows}
            columns={[
              { key: 'concepto', label: 'Concepto' },
              { key: 'categoria', label: 'Categoría' },
              { key: 'proveedor', label: 'Proveedor' },
              { key: 'monto', label: 'Monto original', align: 'right', format: (v, r) => `${r.moneda === 'USD' ? 'US$' : '$'}${(v as number).toLocaleString()}` },
              { key: 'montoMxn', label: 'Monto MXN', align: 'right', format: v => formatMXN(v as number) },
              { key: 'recurrente', label: 'Tipo', format: v => v ? 'Mensual' : 'Único' },
              { key: 'activo', label: 'Estado', format: v => v ? <span className="text-ok text-xs font-medium">Activo</span> : <span className="text-dark/40 text-xs">Inactivo</span> },
            ]}
          />
          <CostosCrud costosIniciales={costos} />
        </>
      )}
    </div>
  )
}
