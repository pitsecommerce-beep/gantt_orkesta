import DataTable from '@/components/DataTable'
import CostosCrud from '@/components/CostosCrud'
import { getCostosFijos, getConfig } from '@/lib/data'
import { formatMXN } from '@/lib/format'
import type { CostoFijo } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface CostoRow extends CostoFijo {
  montoMxn: number
}

export default async function CostosPage() {
  const [costos, config] = await Promise.all([getCostosFijos(), getConfig()])
  const tc = config?.tipo_cambio_mxn_usd ?? 1

  const rows: CostoRow[] = costos.map((c) => ({
    ...c,
    montoMxn: c.moneda === 'USD' ? c.monto * tc : c.monto,
  }))

  const recurrentes = rows.filter((c) => c.recurrente)
  const unicos = rows.filter((c) => !c.recurrente)
  const totalRec = recurrentes.reduce((a, c) => a + c.montoMxn, 0)
  const totalUni = unicos.reduce((a, c) => a + c.montoMxn, 0)

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-serif text-3xl text-navy">Costos Fijos</h1>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-dark/60">
            Recurrentes / mes ({recurrentes.length})
          </p>
          <p className="font-serif text-2xl text-navy">{formatMXN(totalRec)}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-dark/60">
            Únicos ({unicos.length})
          </p>
          <p className="font-serif text-2xl text-navy">{formatMXN(totalUni)}</p>
        </div>
      </section>

      <DataTable<CostoRow>
        rows={rows}
        sortable
        columns={[
          { key: 'concepto', label: 'Concepto' },
          { key: 'categoria', label: 'Categoría' },
          {
            key: 'monto',
            label: 'Monto',
            align: 'right',
            format: (v) => formatMXN(Number(v) || 0),
          },
          { key: 'moneda', label: 'Moneda' },
          {
            key: 'montoMxn',
            label: 'Monto MXN',
            align: 'right',
            format: (v) => formatMXN(Number(v) || 0),
          },
          {
            key: 'recurrente',
            label: 'Tipo',
            format: (v) => (v ? 'Recurrente' : 'Único'),
          },
        ]}
      />

      <CostosCrud costosIniciales={costos} />
    </div>
  )
}
